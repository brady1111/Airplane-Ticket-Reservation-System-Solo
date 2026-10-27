from django.db import models

class Reservation(models.Model):
    reservation_id = models.AutoField(primary_key=True)

    customer = models.ForeignKey(
        'accounts.Customer',
        on_delete=models.DO_NOTHING,
        db_column='customer_id'
    )
    
    booking_reference = models.CharField(max_length=20)
    airline_name = models.CharField(max_length=100)
    flight_number = models.CharField(max_length=20)
    departure_airport = models.CharField(max_length=20)
    arrival_airport = models.CharField(max_length=20)
    departure_date = models.DateField(db_column='depature_date')
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    created_at = models.DateTimeField(db_column='create_at')

    class Meta:
        db_table = 'reservations'
        managed = False
