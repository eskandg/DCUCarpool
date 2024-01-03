import re
from rest_framework import serializers
from .models import CarpoolUser, Driver, Car, Trip, Passenger
import phonenumbers


class CarpoolUserSerializer(serializers.ModelSerializer):
    """
    CarpoolUser serializer used for registering users.
    """

    class Meta:
        model = CarpoolUser

        fields = ["username", "password", "first_name", "last_name", "phone_no"]
        extra_kwargs = {'password': {'write_only': True}}

    @classmethod
    def check_phone_number(cls, phone_number):
        """
        Checks the phone number if its valid (or used for testing).

        :param phone_number:
        :return: boolean, True if phone number is valid, False otherwise
        """
        phone_number = str(phone_number)
        
        fake_numbers_for_testing = {"0"}
        if phone_number in fake_numbers_for_testing:
            return True
   
        try: 
            phone_number = phonenumbers.parse(phone_number, "IE") 
            return phonenumbers.is_valid_number(phone_number)
        except phonenumbers.phonenumberutil.NumberParseException:
            return False

    @staticmethod
    def check_registration_data(data):
        """
        This is used in the API for /register,
        it checks if each field entered through the app is valid in the order each field is in.

        :param data:
        :return: True, if all fields are valid, otherwise a dict containing the appropriate error type and message is returned
        """

        error_type = None
        error_message = None
        
        if len(data["first_name"]) < 1:
            error_type = "first_name"
            error_message = "This field cannot be empty."
        elif not re.sub("['-]", "", data["first_name"]).isalpha():
            error_type = "first_name"
            error_message = "Names can only contain letters."
        elif len(data["last_name"]) < 1: 
            error_type = "last_name"
            error_message = "This field cannot be empty."
        elif not re.sub("['-]", "", data["last_name"]).isalpha():
            error_type = "last_name"
            error_message = "Names can only contain letters."
        elif not CarpoolUserSerializer.check_phone_number(data["phone_no"]):
            error_type = "phone"
            error_message = "Please enter a valid Irish phone number."
        elif len(data["username"]) < 1:
            error_type = "username"
            error_message = "Username field cannot be empty."
        elif len(data["username"]) > 150:
            error_type = "username"
            error_message = "Username must be no longer than 150 characters."
        elif CarpoolUser.objects.filter(username=data["username"]).count() > 0:
            error_type = "username"
            error_message = "Username already exists."
        elif len(data["password"]) < 6: 
            error_type = "password"
            error_message = "Password must be at least 6 characters long."
        elif len(data["password"]) > 128:
            error_type = "password"
            error_message = "Password must be no longer than 128 characters."
        elif data["password"] != data["reEnteredPassword"]:
            error_type = "non_matching_passwords"
            error_message = "Passwords do not match."

        if error_type:
            return {"errorType": error_type, "errorMessage": error_message}

        return True

    def create(self, valid_data):
        """
        Creates user if all data is valid.
        :param valid_data:
        :return: user
        """
        user = CarpoolUser(username=valid_data['username'])
        user.set_password(valid_data['password'])
        user.first_name = valid_data["first_name"].capitalize()
        user.last_name = valid_data["last_name"].capitalize()
        user.is_admin = False
        user.save()
        return user


class DriverSerializer(serializers.ModelSerializer):
    """
    Driver serializer used for creating the driver role for CarpoolUser.
    """

    class Meta:
        model = Driver
        fields = ["uid", "name", "car"]

    def create(self, valid_data):
        driver = Driver(uid=valid_data["uid"], name=valid_data["name"], car=valid_data["car"])
        driver.save()
        return driver


class PassengerSerializer(serializers.ModelSerializer):
    """
    Passenger serializer used for creating the passenger role for CarpoolUser.
    """

    class Meta:
        model = Passenger
        fields = ["uid", "name"]

    def create(self, valid_data):
        passenger = Passenger(uid=valid_data["uid"], name=valid_data["name"])
        passenger.save()
        return passenger


class CarSerializer(serializers.ModelSerializer):
    """
    Car serializer used for creating the car details for Driver.
    """

    class Meta:
        model = Car
        fields = ["make", "model", "colour", "license_plate"]

    def create(self, valid_data):
        car = Car(make=valid_data["make"], model=valid_data["model"], colour=valid_data["colour"], license_plate=valid_data["license_plate"])
        car.save()
        return car


class TripSerializer(serializers.ModelSerializer):
    """
    Trip serializer used for creating the trip for Driver.
    """

    class Meta:
        model = Trip
        fields = ["start", "destination", "waypoints", "distance", "duration", "passengers", "available_seats", "time_of_departure", "ETA"]

    def create(self, data):
        trip = Trip(driver_id=data["driver_id"], 
                    time_of_departure=data["time_of_departure"],
                    ETA=data["ETA"],
                    start=data["start"], 
                    destination=data["destination"],
                    waypoints=data["waypoints"],
                    distance=data["distance"],
                    duration=data["duration"],
                    passengers=data["passengers"],
                    available_seats=data["available_seats"]
                   )
        trip.save()
        return trip