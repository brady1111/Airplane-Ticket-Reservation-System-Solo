from rest_framework import serializers
from ..models import Reservation

#serializer for displaying reservation details
class ReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            'reservation_id',
            'booking_reference',
            'airline_name',
            'flight_number',
            'departure_airport',
            'arrival_airport',
            'departure_date',
            'departure_time',
            'arrival_time',
            'created_at'
        ] 