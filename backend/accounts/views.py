from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers.customer_registration import CustomerRegistrationSerializer
from .serializers.customer_login import CustomerLoginSerializer

from django.middleware.csrf import rotate_token

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

#API endpoint to check if a customer is logged in
@api_view(['GET'])
def check_login_status(request):
    #get the customer's ID from the session
    customer_id = request.session.get('customer_id')

    #check if the customer has an active session (is logged in)
    if not customer_id:
        return Response({
            'authenticated': False,
            'message': 'Customer is not logged in.'
        },
            status=status.HTTP_401_UNAUTHORIZED
        )

    #find the customer associated with the session ID
    customer = Customer.objects.filter(customer_id=customer_id).first()

    #check if the customer exists
    if customer is None:
        request.session.flush()  #clear the session if the customer does not exist
        return Response({   
            'authenticated': False,
            'message': 'Customer not found. Session cleared.'
        },
            status=status.HTTP_401_UNAUTHORIZED
        )

    #return the customer's details if they are logged in
    return Response({
        'authenticated': True,
        'customer_id': customer.customer_id,
        'username': customer.username,
        'f_name': customer.f_name,
        'l_name': customer.l_name,
        'date_of_birth': customer.date_of_birth
    },
        status=status.HTTP_200_OK)
#end of check_login_status function

#P1.1 - Create an Account
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

#P1.2 - Log In
#API endpoint for customer login
@api_view(['POST'])
def customer_login(request):
    #validate the incoming data using the serializer
    serializer = CustomerLoginSerializer(data=request.data)

    if serializer.is_valid():
        #retrieve the customer instance from the serializer after successful validation
        customer = serializer.customer

        #create a new session
        request.session.cycle_key()
        #store the customer's ID in the session to keep them logged in
        request.session['customer_id'] = customer.customer_id
        #rotate the CSRF token to prevent CSRF attacks
        rotate_token(request)

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

#P1.3 - Log Out
#API endpoint to log out a customer
@api_view(['POST'])
def customer_logout(request):
    #clear the customer's session
    request.session.flush()

    return Response(
        {'message': 'Customer logged out successfully.'},
        status=status.HTTP_200_OK
    )