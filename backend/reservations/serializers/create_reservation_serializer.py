
from rest_framework import serializers
from datetime import date

#serializer for validating passenger information
class BookingPassengerSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=100)
    lastName = serializers.CharField(max_length=100)
    dateOfBirth = serializers.DateField()
    seatNumber = serializers.RegexField(regex=r'^(10|[1-9])[A-F]$')

    #validate the passenger's date of birth
    def validate_dateOfBirth(self, value):
        if value > date.today():
            raise serializers.ValidationError(
                'Date of birth cannot be in the future.'
            )
        return value

#serializer for validating a new reservation
class CreateReservationSerializer(serializers.Serializer):
    offer_id = serializers.CharField()
    passengers = BookingPassengerSerializer(many=True)

    #validate passenger count and seat selection
    def validate_passengers(self, value):
        if not 1 <= len(value) <= 5:
            raise serializers.ValidationError(
                'A reservation must have between 1 and 5 passengers.'
            )

        seats = [passenger['seatNumber'] for passenger in value]

        if len(seats) != len(set(seats)):
            raise serializers.ValidationError(
                'Each passenger must have a different seat.'
            )

        return value
