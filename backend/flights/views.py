import os
import requests

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

#P2.1 - Search Flights
#API endpoint to search for flights using the Duffel API
@api_view(['POST'])
def search_flights(request):
    #retrieve customer's search parameters from the request
    departure_airport = request.data.get('departure_airport')
    arrival_airport = request.data.get('arrival_airport')
    departure_date = request.data.get('departure_date')
    passengers = request.data.get('passengers', 1)

    #check if any required search parameters are missing
    if not departure_airport or not arrival_airport or not departure_date:
        return Response(
            {'error': 'Please enter all required search parameters: departure_airport, arrival_airport, and departure_date.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    #retrive the Duffel API access token from environment variables
    api_token = os.getenv('DUFFEL_ACCESS_TOKEN')

    #check if the Duffel API access token is not set
    if not api_token:
        return Response(
            {'error': 'Duffel API access token is not set in the environment variables.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    #create the flight search request
    flight_data = {
        'data': {
            'slices': [
                {
                    'origin': departure_airport,
                    'destination': arrival_airport,
                    'departure_date': departure_date
                }
            ],
            'passengers': [
                {'type': 'adult'} for _ in range(int(passengers))
            ],
            'cabin_class': 'economy'
        }
    }

    #send flight search request to the Duffel API
    try:
        response = requests.post(
            'https://api.duffel.com/air/offer_requests',
            headers={
                'Authorization': f'Bearer {api_token}',
                'Duffel-Version': 'v2',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            json=flight_data,
            params={'return_offers': 'true'},
            timeout=30
        )

        #check if duffel API sends an error
        if not response.ok:
            return Response(
                {'error': f'Duffel API error: {response.status_code} - {response.text}'},
                status=status.HTTP_502_BAD_GATEWAY
            )
        
        #retrieve available flights from Duffel's response
        offers = response.json().get('data', {}).get('offers', [])

        #create a list to store simplified flight information
        flights = []

        #go through each flight offer returned by Duffel
        for offer in offers:

            #retrieve the first flight journey
            slices = offer.get('slices', [])

            #skip offers without flight information
            if not slices:
                continue

            flight_slice = slices[0]
            segments = flight_slice.get('segments', [])

            #skip offers without flight segments
            if not segments:
                continue

            #retrieve departure and arrival information
            first_segment = segments[0]
            last_segment = segments[-1]

            #create a simplified flight object
            flight = {
                'offer_id': offer.get('id'),
                'airline': offer.get('owner', {}).get('name'),
                'flight_number': first_segment.get('marketing_carrier_flight_number'),
                'origin': flight_slice.get('origin', {}).get('iata_code'),
                'destination': flight_slice.get('destination', {}).get('iata_code'),
                'departure_time': first_segment.get('departing_at'),
                'arrival_time': last_segment.get('arriving_at'),
                'duration': flight_slice.get('duration'),
                'price': offer.get('total_amount'),
                'currency': offer.get('total_currency'),
                'stops': len(segments) - 1
            }

            #add the flight to the list
            flights.append(flight)

        #return the simplified flight information
        return Response(
            {'flights': flights},
            status=status.HTTP_200_OK
        )

    except requests.RequestException:
        return Response(
            {'error': 'Unable to connect to the Duffel API.'},
            status=status.HTTP_502_BAD_GATEWAY
        )


