from rest_framework import serializers
from django.contrib.auth.hashers import check_password
from accounts.models import Customer

#serializer for customer login with username and password fields
class CustomerLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False
    )

    #function to validate the username and password
    def validate(self, data):
        #strip leading and trailing whitespace from the username
        username = data['username'].strip()
        password = data['password']

        #find the customer using the username
        customer = Customer.objects.filter(username=username).first()

        #check if the customer exists and if the password matches
        if customer is None or not check_password(password, customer.password):
            raise serializers.ValidationError("Invalid username or password.")

        #store the customer instance in the serializer for later use
        self.customer = customer

        #return the validated data
        return data
    #end of validate function