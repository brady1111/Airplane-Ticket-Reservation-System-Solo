from django.urls import path
from .views import api_home, api_health

urlpatterns = [
    path('', api_home, name='api-home'),
    path('health/', api_health, name='api-health'),
]