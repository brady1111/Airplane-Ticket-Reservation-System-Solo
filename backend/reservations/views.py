from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Reservation

# Create your views here.

#API endpoint to get the total number of reservations
@api_view(['GET'])
def reservation_count(request):
    count = Reservation.objects.count()
    return Response({
        'reservation_count': count
    })