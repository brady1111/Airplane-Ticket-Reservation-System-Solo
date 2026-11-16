
from rest_framework import serializers
from datetime import date


class EditPassengerSerializer(serializers.Serializer):
    passenger_id = serializers.IntegerField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    date_of_birth = serializers.DateField()
    seat_number = serializers.RegexField(
        regex=r'^(10|[1-9])[A-F]$'
    )

    def validate_date_of_birth(self, value):
        if value > date.today():
            raise serializers.ValidationError(
                'Date of birth cannot be in the future.'
            )

        return value


class EditReservationSerializer(serializers.Serializer):
    passengers = EditPassengerSerializer(many=True)

    def validate_passengers(self, value):
        if not 1 <= len(value) <= 5:
            raise serializers.ValidationError(
                'A reservation must have between 1 and 5 passengers.'
            )

        passenger_ids = [
            passenger['passenger_id']
            for passenger in value
        ]

        if len(passenger_ids) != len(set(passenger_ids)):
            raise serializers.ValidationError(
                'Duplicate passengers are not allowed.'
            )

        seats = [
            passenger['seat_number']
            for passenger in value
        ]

        if len(seats) != len(set(seats)):
            raise serializers.ValidationError(
                'Each passenger must have a different seat.'
            )

        return value
