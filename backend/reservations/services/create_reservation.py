
import uuid
from decimal import Decimal
from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from ..models import (
    Reservation,
    CustomerReservation,
    Passenger,
    Ticket,
    FlightSeatAssignment
)
from .flight_time import parse_flight_time


#generate a unique booking reference
def generate_booking_reference():
    return uuid.uuid4().hex[:12].upper()


#generate a unique ticket number
def generate_ticket_number():
    return uuid.uuid4().hex[:16].upper()


#save the reservation and related records
@transaction.atomic
def save_reservation(customer, flight, passengers):
    segments = flight['slices'][0]['segments']
    segment = segments[0]

    departure_airport = segment['origin']['iata_code']
    arrival_airport = segment['destination']['iata_code']

    departure_time = parse_flight_time(
        segment['departing_at'],
        departure_airport
    )

    arrival_time = parse_flight_time(
        segment['arriving_at'],
        arrival_airport
    )

    reservation = Reservation.objects.create(
        customer=customer,
        booking_reference=generate_booking_reference(),
        airline_name=flight['owner']['name'],
        flight_number=str(segment['marketing_carrier_flight_number']),
        departure_airport=segment['origin']['iata_code'],
        arrival_airport=segment['destination']['iata_code'],
        departure_date=departure_time.date(),
        departure_time=departure_time,
        arrival_time=arrival_time,
        created_at=timezone.now(),  # ADD THIS
        total_price=Decimal(flight['total_amount']),
        status='Confirmed'
    )

    CustomerReservation.objects.create(
        customer=customer,
        reservation=reservation
    )

    for index, passenger_data in enumerate(passengers):
        birth_date = passenger_data['dateOfBirth']
        age = departure_time.date().year - birth_date.year

        if (departure_time.date().month, departure_time.date().day) < (
            birth_date.month, birth_date.day
        ):
            age -= 1

        passenger = Passenger.objects.create(
            reservation=reservation,
            f_name=passenger_data['firstName'],
            l_name=passenger_data['lastName'],
            date_of_birth=birth_date,
            passenger_type='Adult' if age >= 18 else 'Child',
            is_main_passenger=(index == 0)
        )

        ticket = Ticket.objects.create(
            reservation=reservation,
            passenger=passenger,
            ticket_number=generate_ticket_number(),
            seat_number=passenger_data['seatNumber']
        )

        FlightSeatAssignment.objects.create(
            airline_name=reservation.airline_name,
            flight_number=reservation.flight_number,
            departure_airport=reservation.departure_airport,
            arrival_airport=reservation.arrival_airport,
            departure_time=reservation.departure_time,
            seat_number=passenger_data['seatNumber'],
            ticket=ticket
        )

    return reservation
