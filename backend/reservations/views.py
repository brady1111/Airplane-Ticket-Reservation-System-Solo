from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Reservation
from .serializers.reservation_serializer import ReservationSerializer

#API endpoint to retrieve the logged-in customer's reservations
@api_view(['GET'])
def customer_reservations(request):

    #get the logged-in customer's ID from the session
    customer_id = request.session.get('customer_id')

    #check whether the customer is logged in
    if not customer_id:
        return Response(
            {'message': 'Customer is not logged in.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    #retrieve reservations associated with the customer
    reservations = Reservation.objects.filter(
        customerreservation__customer_id=customer_id
    ).distinct()

    #convert reservations into JSON
    serializer = ReservationSerializer(reservations, many=True)

    #return the reservations to Angular
    return Response(serializer.data, status=status.HTTP_200_OK)

#end of customer_reservations function

