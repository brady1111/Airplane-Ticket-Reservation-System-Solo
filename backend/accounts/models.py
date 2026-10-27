from django.db import models

class Customer(models.Model):
    customer_id = models.AutoField(primary_key=True)
    f_name = models.CharField(max_length=250)
    l_name = models.CharField(max_length=250)
    date_of_birth = models.DateField()
    username = models.CharField(max_length=50)
    password = models.CharField(max_length=128)

    class Meta:
        db_table = 'customers'
        managed = False