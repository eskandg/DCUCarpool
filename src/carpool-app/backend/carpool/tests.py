import django.db.utils
import phonenumbers
import rest_framework.authtoken.models
from django.db import transaction
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from .models import *


# Create your tests here.

# Model Tests
class CarpoolUserTest(TestCase):
    """
    Tests for CarpoolUser model
    """

    def setUp(self):
        CarpoolUser.objects.create(username="user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")

    def test_username_integrity_constraint(self):
        try:
            with transaction.atomic():
                CarpoolUser.objects.create(username="user", first_name="fname1-1", last_name="lname1-1", phone_no="0871234567")
        except django.db.utils.IntegrityError:
            pass

    def test_user_creation(self):
        user = CarpoolUser.objects.create(username="user1", first_name="fname2", last_name="lname2", phone_no="0871234567", is_admin=True)
        self.assertEqual(user.username, "user1")
        self.assertEqual(user.first_name, "fname2")
        self.assertEqual(user.last_name, "lname2")
        self.assertEqual(user.phone_no, "0871234567")
        self.assertEqual(user.is_admin, True)


class DriverTest(TestCase):
    """
    Tests for Driver model
    """

    def test_nullable(self):
        driver = Driver.objects.create(name="name")
        self.assertEqual(driver.uid, None)
        self.assertEqual(driver.car, None)


# class Passenger(models.Model):
#     id = models.AutoField(primary_key=True)
#     uid = models.ForeignKey("CarpoolUser", on_delete=models.CASCADE, null=True)
#     name = models.CharField(max_length=150)
class PassengerTest(TestCase):
    """
    Tests for Passenger Model
    """

    def test_uid_nullable(self):
        Passenger.objects.create(name="name")


class TripTest(TestCase):
    """
    Tests for Trip model
    """

    def test_cannot_make_trip_without_driver(self):
        try:
            Trip.objects.create()
        except django.db.utils.IntegrityError:
            pass


class CarTest(TestCase):

    def setUp(self):
        car = Car.objects.create(make="Brand", model="Brand model", colour="colour", license_plate="license_plate")
        Driver.objects.create(name="driver_name", car=car)

    def test_driver_owns_car(self):
        driver = Driver.objects.get(name="driver_name")
        car = Car.objects.get(make="Brand")
        self.assertEqual(driver.car.license_plate, car.license_plate)


# API tests
class RegisterTestCase(APITestCase):
    """
    Tests for register
    """

    @classmethod
    def setUpTestData(cls):
        url = reverse("register")
        register_data = {
            "first_name": "userThree",
            "last_name": "userThree",
            "phone_no": "0871234567",
            "username": "user3",
            "password": "123456",
            "reEnteredPassword": "123456",
        }
        return url, register_data

    def test_register(self):
        """
        Normal registration
        """
        url, register_data = self.setUpTestData()

        response = self.client.post(url, register_data, format="json")

        new_user = CarpoolUser.objects.get(username="user3")
        token = Token.objects.get(user=new_user)

        self.assertEqual(token.key, response.data["token"])
        self.assertEqual(register_data["username"], "user3")

    def test_register_phonenumbers(self):
        """
        Test valid and invalid phone numbers
        """

        # with 097 instead of 087
        url, register_data = self.setUpTestData()
        register_data["phone_no"] = "0971234567"

        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "phone")

        # with letters
        register_data["phone_no"] = "08712345TS"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "phone")

        # with nothing
        register_data["phone_no"] = ""

        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "phone")

        # with non-printable characters
        register_data["phone_no"] = "             "

        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "phone")

    def test_register_existing_user(self):
        url, register_data = self.setUpTestData()
        self.client.post(url, register_data, format="json")
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Username already exists.")

    def test_matching_passowrds(self):
        url, register_data = self.setUpTestData()
        self.client.post(url, register_data, format="json")

        # matching
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # not matching
        register_data["username"] = "userFour"
        register_data["password"] = "not_matching"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "non_matching_passwords")

    def test_invalid_input_fields(self):
        url, register_data = self.setUpTestData()

        """
        Blank fields
        """
        register_data["first_name"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "This field cannot be empty.")

        register_data["first_name"] = "a"
        register_data["last_name"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "This field cannot be empty.")

        register_data["last_name"] = "a"
        register_data["username"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Username field cannot be empty.")

        register_data["username"] = "a"
        register_data["password"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Password must be at least 6 characters long.")

        register_data["first_name"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "This field cannot be empty.")

        """
        Input lengths and character validation
        """
        register_data["first_name"] = "a135315"
        register_data["last_name"] = "a"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Names can only contain letters.")

        register_data["first_name"] = "a"
        register_data["last_name"] = "a135315"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Names can only contain letters.")

        register_data["last_name"] = "a"
        register_data["username"] = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        register_data["password"] = "123456"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Username must be no longer than 150 characters.")

        register_data["username"] = "a"
        register_data["password"] = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Password must be no longer than 128 characters.")

        register_data["password"] = "a"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Password must be at least 6 characters long.")


class LoginTestCase(APITestCase):
    """
    Tests for login
    """

    @classmethod
    def setUpTestData(cls):
        url = reverse("login")
        login_data = {
            "username": "test",
            "password": "123456"
        }

        return url, login_data

    def test_login(self):
        """
        Normal login
        """

        # before user is registered
        self.assertNotEqual(True, self.client.login(username="user", password="123456"))

        user = CarpoolUser.objects.create_user(username="user", password="123456")
        Token.objects.create(user=user)

        # after user is registered
        self.assertEqual(True, self.client.login(username="user", password="123456"))


class LogoutTestCase(APITestCase):
    """
    Tests for logging out
    """

    def test_logout(self):
        user = CarpoolUser.objects.create_user(username="user", password="123456")
        token = Token.objects.create(user=user)
        authenticate(user)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.get(reverse("logout"))

        try:
            Token.objects.get(user=user)
            self.fail("Account token still stored after logout.")
        except rest_framework.authtoken.models.Token.DoesNotExist:
            pass


class DeleteAccountTestCase(APITestCase):
    """
    Tests for deleting account
    """

    def test_deleting_account(self):
        user = CarpoolUser.objects.create_user(username="user", password="123456")
        token = Token.objects.create(user=user)
        authenticate(user)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.get(reverse("delete-account"))

        try:
            Token.objects.get(user=user)
            self.fail("Account details and token still stored after deletion.")
        except rest_framework.authtoken.models.Token.DoesNotExist:
            pass


class SetProfileDescriptionTestCase(APITestCase):
    """
    Tests for setting profile description
    """

    def test_profile_description_can_set(self):
        user = CarpoolUser.objects.create_user(username="user", password="123456")
        previous_description = user.profile_description
        self.client.post(reverse("set-profile-description"), {"profileDescription": "description"})


class UpdatePhoneTestCase(APITestCase):
    """
    Tests for updating phone number
    """

    def test_update_phone_number(self):
        user = CarpoolUser.objects.create(username="user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        token = Token.objects.create(user=user)

        previous_phone_no = user.phone_no
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = self.client.post(reverse("update-phone"), {"phoneNumber": "0871234500"})
        self.assertNotEqual(response.data["phone_number"], previous_phone_no)

    def test_phone_number_did_not_update(self):
        user = CarpoolUser.objects.create(username="user1", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        token = Token.objects.create(user=user)
        previous_phone_no = user.phone_no
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = self.client.post(reverse("update-phone"), {"phoneNumber": "087123450b"})
        self.assertIn("error", response.data)


class CreateDriverTestCase(APITestCase):
    """
    Tests for creating a driver
    """

    def test_create_driver(self):
        user = CarpoolUser.objects.create(username="user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        form_data = {"make": "car_make", "model": "car_model", "colour": "car_colour", "license_plate": "car_plate"}
        token, is_created = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.post(reverse("create-driver"), form_data)
        driver = Driver.objects.get(uid=user)
        self.assertEqual(driver.id, user.id)
        self.assertEqual(driver.car.license_plate, "car_plate")


class CreatePassengerTestCase(APITestCase):
    """
    Test for creating a passenger
    """

    @classmethod
    def setUpTestData(cls):
        return {
            "username": "user1",
            "password": "123456",
            "first_name": "fname1",
            "last_name": "lname1",
            "phone_no": "0871234567"
        }

    def test_create_passenger(self):
        user = CarpoolUser.objects.create(**CreatePassengerTestCase.setUpTestData())
        self.assertEqual(Passenger.objects.filter(uid=user).exists(), False)
        passenger_data = {"name": f'{user.first_name} {user.last_name[0]}.', "uid": user}
        Passenger.objects.create(**passenger_data)
        self.assertNotEqual(Passenger.objects.filter(uid=user).exists(), False)

    def test_cannot_recreate_existing_passenger(self):
        user = CarpoolUser.objects.create(**CreatePassengerTestCase.setUpTestData())
        self.assertEqual(Passenger.objects.filter(uid=user).exists(), False)
        passenger_data = {"name": f'{user.first_name} {user.last_name[0]}.', "uid": user}
        Passenger.objects.create(**passenger_data)
        if Passenger.objects.filter(uid=user).exists():
            pass
        else:
            self.fail("Passenger can be re-created")


# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def create_trip(request):
#     """
#     Creates trip for driver, which passengers can search for.
#     """
#
#     if request.method == 'POST':
#         if request.user.status == "available":
#             driver = Driver.objects.get(uid=request.user.id)
#
#             trip = TripSerializer({"driver_id": driver, **request.data})
#             trip = trip.create({"driver_id": driver, **request.data})
#
#             request.user.current_trip = trip
#             request.user.status = "driver_busy"
#             request.user.save()
#             return Response({"tripID": trip.id, "driverID": driver.id, "ETA": trip.ETA}, status=status.HTTP_200_OK)
#         return Response({"error": "You already have an ongoing trip."})


class CreateTripTestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        return {
            "start": {
                "name": "The Spire, O'Connell Street Upper, North City, Dublin, Ireland",
                "lng": -6.2602544,
                "lat": 53.34980600000001
            },
            "destination": {
                "name": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
                "lng": -6.256591399999999,
                "lat": 53.3863494
            },
            "waypoints": {},
            "passengers": {},
            "available_seats": 3,
            "duration": "17 min",
            "distance": "5.7 km",
            "time_of_departure": "2022-03-03T13:40:00.000Z",
            "ETA": "2022-03-03T13:56:56.000Z"
        }

    def test_create_trip(self):
        user = CarpoolUser.objects.create(username="user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        Driver.objects.create(uid=user, name="name")
        token, is_created = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="user", password="123456")
        trip_data = CreateTripTestCase.setUpTestData()
        response = self.client.post(reverse("create-trip"), trip_data, format="json")
        self.assertIn("tripID", response.data)
        self.assertIn("driverID", response.data)
        self.assertIn("ETA", response.data)
        return user, token.key

    def test_ongoing_trip(self):
        user, token = self.test_create_trip()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.client.login(username="user", password="123456")
        trip_data = CreateTripTestCase.setUpTestData()
        response = self.client.post(reverse("create-trip"), trip_data, format="json")
        self.assertIn("error", response.data)

class RemoveTripTestCase(APITestCase):
    """
    Tests for removing a trip
    """

    def test_remove_trip(self):
        user = CarpoolUser.objects.create(username="user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        Driver.objects.create(uid=user, name="name")
        token, is_created = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="user", password="123456")
        trip_data = CreateTripTestCase.setUpTestData()
        response = self.client.post(reverse("create-trip"), trip_data, format="json")
        trip_exists = Trip.objects.filter(id=response.data.get("tripID")).exists()
        self.assertEqual(trip_exists, True)
        response = self.client.post(reverse("remove-trip"), trip_data, format="json")
        trip_exists = Trip.objects.filter(id=response.data.get("tripID")).exists()
        self.assertEqual(trip_exists, False)
        self.assertIn("uids", response.data)


class GetTripsTestCase(APITestCase):

    @classmethod
    def customSetUpTestData(cls, to_dcu):
        trip_data  = {
            "start": {
                "name": "The Spire, O'Connell Street Upper, North City, Dublin, Ireland",
                "lng": -6.2602544,
                "lat": 53.34980600000001
            },
            "destination": {
                "name": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
                "lng": -6.256591399999999,
                "lat": 53.3863494
            },
            "waypoints": {},
            "passengers": {},
            "available_seats": 3,
            "duration": " 17 min",
            "distance": "5.7 km",
            "time_of_departure": "2032-03-03T13:40:00.000Z",
            "ETA": "2032-03-03T13:56:56.000Z"
        }

        if not to_dcu:
            trip_data["start"], trip_data["destination"] = trip_data["destination"], trip_data["start"]

        passenger_trip_search_data = {
            "start": {
                "name": "The Square Tallaght, Belgard Square East, Tallaght, Dublin, Ireland",
                "lng": -6.3717012,
                "lat": 53.2865928
            },
            "destination": {
                "name": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
                "lng": -6.256591399999999,
                "lat": 53.3863494
            },
            "duration": "25 min",
            "distance": "25.1 km",
            "time_of_departure": "2022-03-03T15:06:58.654Z",
            "isPassengerToDCU": to_dcu
        }

        return trip_data, passenger_trip_search_data

    def process_data(self, to_dcu):
        driver_user = CarpoolUser.objects.create(username="driver_user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        Driver.objects.create(uid=driver_user, name="name")
        token, is_created = Token.objects.get_or_create(user=driver_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="driver_user", password="123456")

        trip_data, passenger_trip_search_data = GetTripsTestCase.customSetUpTestData(to_dcu=to_dcu)
        self.client.post(reverse("create-trip"), trip_data, format="json")

        passenger_user = CarpoolUser.objects.create(username="passenger_user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        token, is_created = Token.objects.get_or_create(user=passenger_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="passenger_user", password="123456")
        response = self.client.post(reverse("get-trips"), passenger_trip_search_data, format="json")
        return response.data, trip_data, passenger_trip_search_data

    def test_get_trips_to_dcu(self):
        response_data, trip_data, passenger_trip_search_data = self.process_data(to_dcu=True)
        self.assertEqual(passenger_trip_search_data["start"]["name"], response_data[0]["route"]["route"][0]["destination"])

    def test_get_trips_from_dcu(self):
        response_data, trip_data, passenger_trip_search_data = self.process_data(to_dcu=False)
        self.assertEqual(response_data, [])


class AddPassengerToTripTestCase(APITestCase):
    """
    Tests for adding a passenger to a trip
    """

    @classmethod
    def setUpTestData(cls):
        passenger_trip_data = {
            "tripID": 1,
            "passengerData": {
                "id": "1",
                "name": "passenger",
                "passengerStart": {
                    "name": "The Square Tallaght, Belgard Square East, Tallaght, Dublin, Ireland",
                    "lat": 53.2865928,
                    "lng": -6.3717012
                },
                "passengerDestination": {
                    "name": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
                    "lat": 53.3863494,
                    "lng": -6.256591399999999
                }
            }
        }

        return passenger_trip_data

    def test_add_passenger_to_trip(self):
        passenger_trip_data = self.setUpTestData()
        driver = CarpoolUser.objects.create(username="driver", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        Driver.objects.create(uid=driver, name="name")
        token, is_created = Token.objects.get_or_create(user=driver)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="user", password="123456")
        trip_data = CreateTripTestCase.setUpTestData()
        self.client.post(reverse("create-trip"), trip_data, format="json")
        response = self.client.post(reverse("add-passenger-to-trip"), passenger_trip_data, format="json")
        self.assertIn("passenger1", response.data["trip_data"]["passengers"])


class JoinTripTestCase(APITestCase):
    """
    Tests for joining a trip
    """

    @classmethod
    def setUpTestData(cls):
        trip_data = {
            "trip_data": {
                "id": 4,
                "driver_id": 1,
                "time_of_departure": "2032-03-03T17:05:00Z",
                "ETA": "2032-03-03T17:30:28Z",
                "start": {
                    "name": "The Square Tallaght, Belgard Square East, Tallaght, Dublin, Ireland",
                    "lng": -6.3717012,
                    "lat": 53.2865928
                },
                "destination": {
                    "name": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
                    "lng": -6.256591399999999,
                    "lat": 53.3863494
                },
                "waypoints": {
                    "waypoint1": {
                        "name": "The Square Tallaght, Belgard Square East, Tallaght, Dublin, Ireland",
                        "passenger": "passsenger_user",
                        "lat": 53.2865928,
                        "lng": -6.3717012
                    }
                },
                "distance": "22.7 km",
                "duration": "0 hours, 25 min, 28 sec",
                "route": {
                    "route": [
                        {
                            "start": "The Square Tallaght, Belgard Square East, Tallaght, Dublin, Ireland",
                            "destination": "The Square Tallaght, Belgard Square East, Tallaght, Dublin, Ireland",
                            "distance": "1 m",
                            "duration": "1 min",
                            "departure_time": "17:05 03/03/2022",
                            "arrival_time": "17:05 03/03/2022"
                        },
                        {
                            "start": "The Square Tallaght, Belgard Square East, Tallaght, Dublin, Ireland",
                            "destination": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
                            "distance": "22.7 km",
                            "duration": "25 mins",
                            "departure_time": "17:05 03/03/2022",
                            "arrival_time": "17:30 03/03/2022"
                        }
                    ]
                },
                "passengers": {
                    "passenger1": {
                        "passengerName": "passenger_user",
                        "passengerID": "1",
                        "passengerStart": "The Square Tallaght, Belgard Square East, Tallaght, Dublin, Ireland",
                        "passengerDestination": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9"
                    }
                },
                "available_seats": 2,
                "driverPhone": 871234567,
                "car": {
                    "id": 1,
                    "make": "Tesla",
                    "model": "Roadster",
                    "colour": "Red",
                    "license_plate": "123"
                },
                "driverName": "driver_user"
            },
            "passenger_route": {}
        }

        return trip_data

    def process_data(self):
        driver_user = CarpoolUser.objects.create(username="driver_user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        driver_user_driver = Driver.objects.create(uid=driver_user, name="name")
        token, is_created = Token.objects.get_or_create(user=driver_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="driver_user", password="123456")

        trip_data, passenger_trip_data = GetTripsTestCase.customSetUpTestData(to_dcu=True)
        passenger_trip_data = AddPassengerToTripTestCase.setUpTestData()
        driver_user_driver.car = Car.objects.create(make="make", model="model", colour="colour", license_plate="plate")
        driver_user_driver.save()

        response = self.client.post(reverse("create-trip"), trip_data, format="json")
        trip = Trip.objects.get(id=response.data.get("tripID"))
        driver_user.current_trip = trip
        driver_user.save()

        self.client.post(reverse("add-passenger-to-trip"), passenger_trip_data, format="json")

        passenger_user = CarpoolUser.objects.create(username="passenger_user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        passenger_user.current_trip = Trip.objects.get(id=response.data.get("tripID"))
        passenger_user.save()

        token, is_created = Token.objects.get_or_create(user=passenger_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="passenger_user", password="123456")
        response = self.client.get(reverse("join-trip"), format="json")
        return response.data, trip_data

    def test_join_trip(self):
        data = self.process_data()
        self.assertNotEqual(data[0]["trip_data"]["distance"], data[1]["distance"])


class EndTripTestCase(APITestCase):
    """
    Tests for ending a trip
    """

    def test_end_trip(self):
        user = CarpoolUser.objects.create(username="user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        Driver.objects.create(uid=user, name="name")
        token, is_created = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="user", password="123456")
        trip_data = CreateTripTestCase.setUpTestData()
        response = self.client.post(reverse("create-trip"), trip_data, format="json")
        trip_exists = Trip.objects.filter(id=response.data.get("tripID")).exists()
        self.assertEqual(trip_exists, True)
        response = self.client.post(reverse("end-trip"), trip_data, format="json")
        trip_exists = Trip.objects.filter(id=response.data.get("tripID")).exists()
        self.assertEqual(trip_exists, False)
        self.assertIn("error", response.data)


class PassengerLeaveTripTestCase(APITestCase):
    """
    Tests for passenger leaving a trip
    """

    def test_passenger_leave_trip(self):
        passenger = CarpoolUser.objects.create(username="passenger", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        passenger_trip_data = AddPassengerToTripTestCase.setUpTestData()
        user_driver = CarpoolUser.objects.create(username="driver", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")
        driver = Driver.objects.create(uid=user_driver, name="name")
        token, is_created = Token.objects.get_or_create(user=user_driver)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="driver", password="123456")
        trip_data = CreateTripTestCase.setUpTestData()
        self.client.post(reverse("create-trip"), trip_data, format="json")

        token, is_created = Token.objects.get_or_create(user=passenger)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.login(username="passenger", password="123456")
        self.client.post(reverse("add-passenger-to-trip"), passenger_trip_data, format="json")

        self.assertNotEqual(Trip.objects.get(driver_id=driver).passengers, {})
        self.client.get(reverse("passenger-leave-trip"))
        self.assertEqual(Trip.objects.get(driver_id=driver).passengers, {})
