
import logging
import requests

from datetime import timedelta

from django.db import transaction, IntegrityError
from django.utils import timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from accounts.models import Customer

from .models import (
    Reservation,
    Passenger,
    Ticket,
    FlightSeatAssignment
)

from .serializers.create_reservation_serializer import (
    CreateReservationSerializer
)
from .serializers.reservation_serializer import (
    ReservationSerializer
)
from .serializers.edit_reservation_serializer import (
    EditReservationSerializer
)

from .services.flight_time import parse_flight_time
from .services.flight_offer import get_flight_offer
from .services.create_reservation import save_reservation


logger = logging.getLogger(__name__)


#retrieve occupied seats for a specific flight
@api_view(['GET'])
def flight_seat_availability(request):

    airline_name = request.query_params.get('airline_name')
    flight_number = request.query_params.get('flight_number')
    departure_airport = request.query_params.get('departure_airport')
    arrival_airport = request.query_params.get('arrival_airport')
    departure_time = request.query_params.get('departure_time')

    #validate required flight information
    if not all([
        airline_name,
        flight_number,
        departure_airport,
        arrival_airport,
        departure_time
    ]):
        return Response(
            {'message': 'Missing required flight information.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    #convert airport-local departure time to timezone-aware datetime
    try:
        flight_departure = parse_flight_time(
            departure_time,
            departure_airport
        )

    except (ValueError, TypeError):
        return Response(
            {'message': 'Invalid flight departure time or airport.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    #retrieve occupied seats directly from PostgreSQL
    occupied_seats = list(
        FlightSeatAssignment.objects.filter(
            airline_name=airline_name,
            flight_number=flight_number,
            departure_airport=departure_airport,
            arrival_airport=arrival_airport,
            departure_time=flight_departure
        ).values_list('seat_number', flat=True)
    )

    logger.debug(
        'Occupied seats for %s %s departing %s: %s',
        airline_name,
        flight_number,
        flight_departure,
        occupied_seats
    )

    return Response(
        {'occupied_seats': occupied_seats},
        status=status.HTTP_200_OK
    )


#API endpoint to edit a reservation
@api_view(['PUT'])
def edit_reservation(request, reservation_id):

    customer_id = request.session.get('customer_id')

    if not customer_id:
        return Response(
            {'message': 'Customer is not logged in.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    serializer = EditReservationSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():

            #retrieve and lock the customer's reservation
            reservation = Reservation.objects.select_for_update().filter(
                reservation_id=reservation_id,
                customerreservation__customer_id=customer_id
            ).first()

            if reservation is None:
                return Response(
                    {'message': 'Reservation not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if reservation.status != 'Confirmed':
                return Response(
                    {'message': 'Only confirmed reservations can be edited.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            #enforce the 7-day restriction
            if reservation.departure_time <= timezone.now() + timedelta(days=7):
                return Response(
                    {
                        'message':
                        'Reservations cannot be edited within 7 days of departure.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            submitted_passengers = serializer.validated_data['passengers']

            existing_passengers = list(
                Passenger.objects.filter(
                    reservation=reservation
                ).order_by('passenger_id')
            )

            existing_ids = {
                passenger.passenger_id
                for passenger in existing_passengers
            }

            submitted_ids = {
                passenger['passenger_id']
                for passenger in submitted_passengers
            }

            #verify every passenger belongs to this reservation
            if submitted_ids != existing_ids:
                return Response(
                    {
                        'message':
                        'Passenger information does not match this reservation.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            #retrieve tickets for the reservation
            tickets = {
                ticket.passenger_id: ticket
                for ticket in Ticket.objects.filter(
                    reservation=reservation
                )
            }

            if set(tickets.keys()) != existing_ids:
                return Response(
                    {
                        'message':
                        'Reservation ticket information is incomplete.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            #remove previous seat assignments
            FlightSeatAssignment.objects.filter(
                ticket__reservation=reservation
            ).delete()

            passenger_lookup = {
                passenger.passenger_id: passenger
                for passenger in existing_passengers
            }

            for passenger_data in submitted_passengers:

                passenger = passenger_lookup[
                    passenger_data['passenger_id']
                ]

                #update passenger information
                passenger.f_name = passenger_data['first_name']
                passenger.l_name = passenger_data['last_name']
                passenger.date_of_birth = passenger_data['date_of_birth']

                passenger.save(
                    update_fields=[
                        'f_name',
                        'l_name',
                        'date_of_birth'
                    ]
                )

                #update the passenger's ticket
                ticket = tickets[passenger.passenger_id]
                ticket.seat_number = passenger_data['seat_number']
                ticket.save(update_fields=['seat_number'])

                #reserve the updated seat
                FlightSeatAssignment.objects.create(
                    airline_name=reservation.airline_name,
                    flight_number=reservation.flight_number,
                    departure_airport=reservation.departure_airport,
                    arrival_airport=reservation.arrival_airport,
                    departure_time=reservation.departure_time,
                    seat_number=passenger_data['seat_number'],
                    ticket=ticket
                )

    except IntegrityError:
        logger.exception(
            'Database integrity error while editing reservation %s',
            reservation_id
        )

        return Response(
            {'message': 'One or more selected seats are already taken, or reservation data conflicts with the database.'},
            status=status.HTTP_409_CONFLICT
        )

    return Response(
        {'message': 'Reservation updated successfully.'},
        status=status.HTTP_200_OK
    )


#API endpoint to create a new reservation
@api_view(['POST'])
def create_reservation(request):

    #check whether the customer is logged in
    customer_id = request.session.get('customer_id')

    if not customer_id:
        return Response(
            {'message': 'Customer is not logged in.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    customer = Customer.objects.filter(
        customer_id=customer_id
    ).first()

    if customer is None:
        return Response(
            {'message': 'Customer account was not found.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    #validate passenger information and seat selections
    serializer = CreateReservationSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    offer_id = serializer.validated_data['offer_id']
    passengers = serializer.validated_data['passengers']

    #retrieve the selected flight offer from Duffel
    try:
        flight = get_flight_offer(offer_id)

    except (requests.RequestException, ValueError, KeyError):
        logger.exception('Unable to retrieve selected flight offer')

        return Response(
            {
                'message':
                'Unable to verify the selected flight. Please search again.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    #validate that the offer is for a direct flight
    slices = flight.get('slices', [])

    if len(slices) != 1 or len(slices[0].get('segments', [])) != 1:
        return Response(
            {
                'message':
                'Only direct flights are supported for seat selection.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    #verify the offer passenger count
    if len(flight.get('passengers', [])) != len(passengers):
        return Response(
            {
                'message':
                'Passenger count does not match the selected flight offer.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    #save the reservation
    try:
        reservation = save_reservation(
            customer,
            flight,
            passengers
        )

    except IntegrityError:
        logger.exception(
            'Database integrity error while creating reservation'
        )

        return Response(
            {
                'message':
                'Unable to save reservation due to a database error.'
            },
            status=status.HTTP_409_CONFLICT
        )

    return Response(
        {
            'message': 'Reservation created successfully.',
            'reservation_id': reservation.reservation_id,
            'booking_reference': reservation.booking_reference
        },
        status=status.HTTP_201_CREATED
    )


#API endpoint to retrieve the logged-in customer's reservations
@api_view(['GET'])
def customer_reservations(request):

    customer_id = request.session.get('customer_id')

    if not customer_id:
        return Response(
            {'message': 'Customer is not logged in.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    #retrieve reservations associated with the customer
    reservations = Reservation.objects.filter(
        customerreservation__customer_id=customer_id
    ).distinct()

    serializer = ReservationSerializer(
        reservations,
        many=True
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )


#API endpoint to retrieve details for a specific reservation
@api_view(['GET'])
def reservation_details(request, reservation_id):

    customer_id = request.session.get('customer_id')

    if not customer_id:
        return Response(
            {'message': 'Customer is not logged in.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    reservation = Reservation.objects.filter(
        reservation_id=reservation_id,
        customerreservation__customer_id=customer_id
    ).first()

    if reservation is None:
        return Response(
            {'message': 'Reservation not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    passengers = Passenger.objects.filter(
        reservation=reservation
    ).order_by('passenger_id')

    passenger_details = []

    for passenger in passengers:

        ticket = Ticket.objects.filter(
            reservation=reservation,
            passenger=passenger
        ).first()

        passenger_details.append({
            'passenger_id': passenger.passenger_id,
            'first_name': passenger.f_name,
            'last_name': passenger.l_name,
            'date_of_birth': passenger.date_of_birth,
            'passenger_type': passenger.passenger_type,
            'is_main_passenger': passenger.is_main_passenger,
            'ticket_number': ticket.ticket_number if ticket else None,
            'seat_number': ticket.seat_number if ticket else None
        })

    return Response(
        {
            'reservation': ReservationSerializer(reservation).data,
            'passengers': passenger_details
        },
        status=status.HTTP_200_OK
    )


#API endpoint to cancel a reservation
@api_view(['POST'])
def cancel_reservation(request, reservation_id):

    customer_id = request.session.get('customer_id')

    if not customer_id:
        return Response(
            {'message': 'Customer is not logged in.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    with transaction.atomic():

        reservation = Reservation.objects.select_for_update().filter(
            reservation_id=reservation_id,
            customerreservation__customer_id=customer_id
        ).first()

        if reservation is None:
            return Response(
                {'message': 'Reservation not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if reservation.status != 'Confirmed':
            return Response(
                {'message': 'Only confirmed reservations can be canceled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        #enforce the 7-day restriction
        if reservation.departure_time <= timezone.now() + timedelta(days=7):
            return Response(
                {
                    'message':
                    'Reservations cannot be canceled within 7 days of departure.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        #release the seats associated with this reservation
        FlightSeatAssignment.objects.filter(
            ticket__reservation=reservation
        ).delete()

        reservation.status = 'Cancelled'
        reservation.save(update_fields=['status'])

    return Response(
        {'message': 'Reservation canceled successfully.'},
        status=status.HTTP_200_OK
    )
