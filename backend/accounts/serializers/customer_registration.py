import re #imports the regular expression module for pattern matching.

from datetime import date #imports the date class from the datetime module for handling date-related operations.

from rest_framework import serializers #provides Django REST Framework's input-validation tools.
from django.contrib.auth.hashers import make_password #provides a function to hash passwords for secure storage.
from ..models import Customer #imports the Customer model from the current app's models.py file.
from django.contrib.auth.password_validation import validate_password #provides a function to validate passwords according to Django's password validators.

#serializer for customer registration with validation for date of birth and password
#ensures that the user is at least 18 years old and that the password is properly hashed
class CustomerRegistrationSerializer(serializers.Serializer):
    f_name = serializers.CharField(max_length=250)
    l_name = serializers.CharField(max_length=250)
    date_of_birth = serializers.DateField()
    username = serializers.CharField(max_length=50)

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False
    )

    #function to validate the date of birth field
    def validate_date_of_birth(self, value):
        today = date.today() #store today's date
        age = today.year - value.year #store the user's age

        #check if the date of birth is in the future
        if value >= today:
            raise serializers.ValidationError("Date of birth must be in the past.")

        #check if the user is at least 18 years old
        if (today.month, today.day) < (
            value.month, value.day):
            age -= 1

        #if the user is under 18, raise a validation error
        if age < 18:
            raise serializers.ValidationError(
                "You must be at least 18 years old to create an account."
            )

        #return the validated date of birth if all checks pass
        return value
    #end of validate_date_of_birth function

    #function to validate the username field
    def validate_username(self, value):
        value = value.strip() #remove leading and trailing whitespace from the username

        #check if the username is already taken
        if not value:
            raise serializers.ValidationError("Username cannot be empty.")

        #check if the username contains only allowed characters
        if not re.fullmatch(r"[a-zA-Z0-9_.-]+", value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, "
                "periods, underscores, and hyphens."
            )

        #check if the username is already taken
        if Customer.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username is already taken.")

        #return the validated username if all checks pass
        return value
    #end of validate_username function

    #function to validate the password field
    def validate_password(self, value):
        try:
            validate_password(value) #validate the password according to Django's password validators
        except serializers.ValidationError:
            raise serializers.ValidationError(
                "Password does not meet the required criteria."
            )

        #return the validated password if all checks pass
        return value
    #end of validate_password function

    #function to validate that password and confirm password match
    def validate_confirm_password(self, value):
        #retrieve the original password from the request
        password = self.initial_data.get('password')

        #check if both passwords match
        if password != value:
            raise serializers.ValidationError(
                "Passwords do not match."
            )

        #return the validated confirm password
        return value
    #end of validate_confirm_password function

    #function to validate name
    def validate_name(self, value):
        value = value.strip() #remove leading and trailing whitespace from the name
        
        #check if the name is empty
        if not value:
            raise serializers.ValidationError("Name cannot be empty.")

        #return the validated name if all checks pass
        return value
    #end of validate_name function

    #functions to validate first name and last name fields
    def validate_f_name(self, value):
        return self.validate_name(value)
    def validate_l_name(self, value):   
        return self.validate_name(value)
    #end of validate_f_name and validate_l_name functions

    #function to create a new customer instance
    def create(self, validated_data):
        #remove confirm_password because it is not stored in the database
        validated_data.pop('confirm_password')
        #hash the customer's password before saving
        validated_data['password'] = make_password(validated_data['password'])
        return Customer.objects.create(**validated_data)
    #end of create function