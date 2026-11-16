
import os
import requests

#retrieve the selected flight offer from Duffel
def get_flight_offer(offer_id):
    api_token = os.getenv('DUFFEL_ACCESS_TOKEN')

    if not api_token:
        raise ValueError('Duffel API access token is not configured.')

    response = requests.get(
        f'https://api.duffel.com/air/offers/{offer_id}',
        headers={
            'Authorization': f'Bearer {api_token}',
            'Duffel-Version': 'v2',
            'Accept': 'application/json'
        },
        timeout=30
    )

    response.raise_for_status()

    return response.json()['data']
