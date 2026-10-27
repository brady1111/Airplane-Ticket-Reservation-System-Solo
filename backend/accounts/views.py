from rest_framework.decorators import api_view
from rest_framework.response import Response

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
