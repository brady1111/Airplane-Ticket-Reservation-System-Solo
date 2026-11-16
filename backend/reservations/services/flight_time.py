from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import airportsdata
from django.utils import timezone


AIRPORTS = airportsdata.load("IATA")


def get_airport_timezone(airport_code):
    #retrieve the airport's IANA timezone
    airport = AIRPORTS.get(airport_code.upper())

    if airport is None:
        raise ValueError(
            f"Timezone information unavailable for airport {airport_code}."
        )

    timezone_name = airport.get("tz")

    if not timezone_name:
        raise ValueError(
            f"Timezone information unavailable for airport {airport_code}."
        )

    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as error:
        raise ValueError(
            f"Invalid timezone for airport {airport_code}."
        ) from error


def parse_flight_time(time_value, airport_code):
    #parse the timestamp returned by Duffel
    flight_time = datetime.fromisoformat(
        time_value.replace("Z", "+00:00")
    )

    #preserve timezone information if already supplied
    if timezone.is_aware(flight_time):
        return flight_time

    #Duffel's naive timestamp represents airport-local time
    airport_timezone = get_airport_timezone(airport_code)

    return timezone.make_aware(
        flight_time,
        airport_timezone
    )
