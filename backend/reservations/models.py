from django.db import models

#models for the reservations
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
    departure_date = models.DateField(db_column='departure_date')
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    created_at = models.DateTimeField(db_column='created_at')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default='Confirmed')

    class Meta:
        db_table = 'reservations'
        managed = False

#models for the customer reservations
class CustomerReservation(models.Model):
    customer_reservation_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(
        'accounts.Customer',
        on_delete=models.DO_NOTHING,
        db_column='customer_id'
    )
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.DO_NOTHING,
        db_column='reservation_id'
    )

    class Meta:
        db_table = 'customer_reservations'
        managed = False

#models for the passengers
class Passenger(models.Model):
    passenger_id = models.AutoField(primary_key=True)
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.DO_NOTHING,
        db_column='reservation_id'
    )
    f_name = models.CharField(max_length=100)
    l_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    passenger_type = models.CharField(max_length=50)
    is_main_passenger = models.BooleanField(default=False)

    class Meta:
        db_table = 'passengers'
        managed = False

#models for tickets
class Ticket(models.Model):
    ticket_id = models.AutoField(primary_key=True)
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.DO_NOTHING,
        db_column='reservation_id'
    )
    passenger = models.ForeignKey(
        Passenger,
        on_delete=models.DO_NOTHING,
        db_column='passenger_id'
    )
    ticket_number = models.CharField(max_length=20)
    seat_number = models.CharField(max_length=10)

    class Meta:
        db_table = 'tickets'
        managed = False

#model for tracking occupied seats on each flight
class FlightSeatAssignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    airline_name = models.CharField(max_length=100)
    flight_number = models.CharField(max_length=20)
    departure_airport = models.CharField(max_length=20)
    arrival_airport = models.CharField(max_length=20)
    departure_time = models.DateTimeField()
    seat_number = models.CharField(max_length=10)
    ticket = models.OneToOneField(
        Ticket,
        on_delete=models.DO_NOTHING,
        db_column='ticket_id'
    )

    class Meta:
        db_table = 'flight_seat_assignments'
        managed = False
