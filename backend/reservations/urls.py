from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_reservation, name='create_reservation'),
    path('customer/', views.customer_reservations, name='customer_reservations'),
    path('<int:reservation_id>/details/', views.reservation_details, name='reservation_details'),
    path('<int:reservation_id>/cancel/', views.cancel_reservation, name='cancel_reservation'),
    path('<int:reservation_id>/edit/', views.edit_reservation, name='edit_reservation'),
    path('seats/occupied/', views.flight_seat_availability, name='flight_seat_availability'),
]
