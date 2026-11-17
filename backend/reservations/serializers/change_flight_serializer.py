from rest_framework import serializers

class ChangeFlightPassengerSerializer(serializers.Serializer):
    passenger_id = serializers.IntegerField(min_value=1)
    seat_number = serializers.RegexField(regex=r'^(10|[1-9])[A-F]$')

class ChangeFlightSerializer(serializers.Serializer):
    offer_id = serializers.CharField()
    passengers = ChangeFlightPassengerSerializer(many=True)

    def validate_passengers(self, value):
        if not 1 <= len(value) <= 5:
            raise serializers.ValidationError('A reservation must have 1 to 5 passengers.')
        ids = [p['passenger_id'] for p in value]
        seats = [p['seat_number'] for p in value]
        if len(ids) != len(set(ids)) or len(seats) != len(set(seats)):
            raise serializers.ValidationError('Duplicate passengers or seats are not allowed.')
        return value