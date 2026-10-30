from django.urls import path
from .views import reservation_count

urlpatterns = [
    path('count/', reservation_count, name='reservation-count'),
]
