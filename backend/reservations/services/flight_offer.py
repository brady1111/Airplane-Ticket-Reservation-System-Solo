
import os
import logging
import requests

logger = logging.getLogger(__name__)


# Retrieve the selected flight offer from Duffel
def get_flight_offer(offer_id):
    api_token = os.getenv("DUFFEL_ACCESS_TOKEN")

    if not api_token:
        raise ValueError("Duffel API access token is not configured.")

    if not offer_id:
        raise ValueError("No flight offer ID was provided.")

    response = requests.get(
        f"https://api.duffel.com/air/offers/{offer_id}",
        headers={
            "Authorization": f"Bearer {api_token}",
            "Duffel-Version": "v2",
            "Accept": "application/json",
        },
        timeout=30,
    )

    if response.status_code == 404:
        logger.warning("Duffel offer not found: %s", offer_id)

    response.raise_for_status()

    return response.json()["data"]
