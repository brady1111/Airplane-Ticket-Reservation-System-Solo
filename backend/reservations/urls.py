from django.urls import path
from .views import customer_reservations

urlpatterns = [
    path('', customer_reservations, name='customer-reservations'),
]
