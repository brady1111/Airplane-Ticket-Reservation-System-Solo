from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers.customer_registration import CustomerRegistrationSerializer
from .serializers.customer_login import CustomerLoginSerializer

from .models import Customer

#original API connection endpoint
@api_view(['GET'])
def api_home(request):
    return Response({
        'message': 'Airplane Reservation API is working!'
    })


#API health check endpoint
@api_view(['GET'])
def api_health(request):
    return Response({
        'status': 'ok',
        'message': 'Airplane Reservation API is running!'
    })
#end of api_health function

#API endpoint to get the total number of customers
@api_view(['GET'])
def customer_count(request):
    count = Customer.objects.count()
    return Response({
        'customer_count': count
    })
#end of customer_count function

#API endpoint to register a new customer
@api_view(['POST'])
def register_customer(request):
    serializer = CustomerRegistrationSerializer(data=request.data)

    #validate the incoming data using the serializer
    if serializer.is_valid():
        customer = serializer.save()

        #return a response with the created customer's details
        return Response(
            {
                'message': 'Customer account created successfully.',
                'customer_id': customer.customer_id,
                'username': customer.username
            },
            status=status.HTTP_201_CREATED
        )

    #if the data is not valid, return a response with the validation errors
    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )
#end of register_customer function

#API endpoint for customer login
@api_view(['POST'])
def customer_login(request):
    #validate the incoming data using the serializer
    serializer = CustomerLoginSerializer(data=request.data)

    if serializer.is_valid():
        #retrieve the customer instance from the serializer after successful validation
        customer = serializer.customer

        #return a response with the customer's details after successful login
        return Response(
            {
                'message': 'Customer logged in successfully.',
                'customer_id': customer.customer_id,
                'username': customer.username
            },
            #include the customer's ID and username in the response
            status=status.HTTP_200_OK
        )

    #if the data is not valid, return a response with the validation errors
    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )
#end of customer_login function