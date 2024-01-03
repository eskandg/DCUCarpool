import json

import requests
from datetime import timedelta, datetime
from django.core import serializers as django_serializers
from django.forms.models import model_to_dict
from django.contrib.auth import authenticate, login as django_login
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import *
from .models import *
from django.conf import settings
import urllib
import phonenumbers


"""
Carpool API
"""

@api_view(["POST"])
def register(request):
    """
    Users will send registration data on the app,
    the registration data needs to be validated before creating the user,
    such validation could be checking if the user already exists, or if the passwords entered do not match.
    (see the check_registration_data method for more info in serializers.py)

    If registration data is valid, a user is created along with their authorization token,
    their user data is sent back in the response, and they are logged into django.
    Otherwise, if invalid, an appropriate error message is sent back.
    """

    if request.method == "POST":
        is_registration_correct = CarpoolUserSerializer.check_registration_data(data=request.data)
        if is_registration_correct is True:
            carpool_user = CarpoolUserSerializer(data=request.data)
            if carpool_user.is_valid():
                temp_user = carpool_user.create(request.data)
                token = Token.objects.create(user=temp_user)

                user_data = {"id": temp_user.id, "username": temp_user.username,
                             "token": token.key, "phone_no": temp_user.phone_no}
                django_login(request, temp_user)

                return Response(user_data, status=status.HTTP_201_CREATED)
            return Response({"error": "could not register user."})
        else:
            return Response(is_registration_correct)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login(request):
    """
    Users will send login data on the app.

    If login data is valid, the user's data is sent back.
    If the user is currently in a trip (driver/passenger) the trip data is also sent back.
    Otherwise, if login data is invalid, an appropriate error message is sent back.
    """

    if request.method == "POST":
        name = request.data.get("username")
        password = request.data.get("password")
        if name and password:
            carpool_user = authenticate(username=name, password=password)
            # if login details were validated
            if carpool_user is not None:
                django_login(request, carpool_user)
                token, created = Token.objects.get_or_create(user=carpool_user)
                # calculates user's current trip if they are in one and sends the data as response.
                trip = {}
                user_status = "available"
                passenger_route = {} 
                if carpool_user.current_trip is not None: 
                    trip = model_to_dict(carpool_user.current_trip) 
                    trip["driverPhone"] = carpool_user.current_trip.driver_id.uid.phone_no
                    trip["car"] = model_to_dict(carpool_user.current_trip.driver_id.car)
                    trip["driverName"] = f"{carpool_user.current_trip.driver_id.uid.first_name} {carpool_user.current_trip.driver_id.uid.last_name[0]}."
                    if carpool_user.id == carpool_user.current_trip.driver_id.uid.id:
                        user_status = "driver_busy"
                    else:
                        """
                        If user is a passenger in a trip
                        gathers their personalised trip information including personalised times and locations and sends in response.
                        This is used in frontend to show each passenger their personalised departure/arrival times
                        """

                        user_status = "passenger_busy"
                        passenger_info = trip["passengers"][f"passenger{carpool_user.id}"]

                        dcu_campuses = ["Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
                                        "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland"]
                        # If trip is TO DCU
                        if trip["start"]["name"] not in dcu_campuses:
                            passenger_loc = passenger_info["passengerStart"]
                            route_info = [r for r in trip["route"]["route"] if r["start"] == passenger_loc][0]
                            passenger_route = {
                                "passengerDestLoc": trip["destination"]["name"],
                                "passengerArrivalTime" : trip["ETA"].strftime("%Y-%m-%dT%H:%M"),
                                "passengerStartLoc": route_info["start"],
                                "passengerDepartureTime": datetime.strptime(str(route_info["departure_time"]), "%H:%M %m/%d/%Y"),
                            }

                        # If trip is FROM DCU
                        else:
                            passenger_loc = passenger_info["passengerDestination"]
                            route_info = [r for r in trip["route"]["route"] if r["destination"] == passenger_loc][0]
                            passenger_route = {
                                "passengerDestLoc": route_info["destination"],
                                "passengerArrivalTime" : datetime.strptime(str(route_info["arrival_time"]), "%H:%M %m/%d/%Y"),
                                "passengerStartLoc": trip["start"]["name"],
                                "passengerDepartureTime": trip["time_of_departure"].strftime("%Y-%m-%dT%H:%M"),  
                            }
                            
                return Response({
                    "id": carpool_user.id,
                    "username": carpool_user.username,
                    "first_name": carpool_user.first_name,
                    "last_name": carpool_user.last_name,
                    "phone_no": carpool_user.phone_no,
                    "status": user_status,
                    "trip_data": trip,
                    "token": token.key,
                    "passenger_route": passenger_route,
                    "date_joined": carpool_user.date_joined.strftime("%d-%m-%Y")
                })
            else:
                return Response("Incorrect username or password.")

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Users can log out through the settings menu.
    Users send their auth token to be destroyed then we send back a 200 response to signal React Native to go back to
    the login and registration screens.
    """

    request.user.auth_token.delete()
    return Response(status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Users can delete through the settings menu for account.
    Users send their auth token to be destroyed then we send back a 200 response to signal React Native to go back to
    the login and registration screens. All data related to the user should be deleted.
    """

    request.user.delete()
    return Response(status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_profile_description(request):
    """
    Sets profile description of a user who has sent the request
    """

    if request.method == "POST":
        profile_description = request.data.get("profileDescription")
        if type(profile_description) == str:
            request.user.profile_description = profile_description
            request.user.save()
            return Response(status=status.HTTP_200_OK)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Gets profile data of a user
    """

    if request.method == "POST": 
        uid = request.data.get("uid")
        if CarpoolUser.objects.filter(id=uid).exists():
            user = CarpoolUser.objects.get(id=uid)
            return Response({
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": user.phone_no,
                "profile_description": user.profile_description
            }, status=status.HTTP_200_OK)
    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_phone(request):
    """
    Updates phone number of the user who has requested if validated
    """

    user = CarpoolUser.objects.get(id=request.user.id)
    new_phone_no = str(request.data.get("phoneNumber"))

    try:
        phone_number = phonenumbers.parse(new_phone_no, "IE")
        number_valid = phonenumbers.is_valid_number(phone_number)
    except phonenumbers.phonenumberutil.NumberParseException:
        number_valid = False

    if number_valid:
        user.phone_no = new_phone_no
        user.save()
        return Response({"status": "success", "phone_number": new_phone_no}, status=status.HTTP_200_OK)
    else:
        return Response({"error": "phone"}, status=status.HTTP_400_BAD_REQUEST)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_driver(request):
    """
    Gets driver, if they exist, their details are sent back in the response,
    otherwise it returns status 404. Used to determine whether the user has ever been a driver.
    """
    return Response({"driver_exists": Driver.objects.filter(uid=request.user.id).exists()}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_driver(request):
    """ 
    Creates driver if they already don't exist, and returns their details,
    if the driver already exists an error is sent back in the response.
    """

    if request.method == "POST":
        is_vehicle_valid = True  
        if is_vehicle_valid is True:
            user = request.user
            name = f"{user.first_name} {user.last_name[0]}."
            temp_car = CarSerializer(data=request.data)
            car = temp_car.create(request.data)
            driver_data = {"name": name, "car": car, "uid": request.user}

            driver = DriverSerializer(data=request.data)
            driver.create(driver_data)

            return Response(request.data, status=status.HTTP_201_CREATED)

        else:
            return Response({"error": "Driver not created"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def create_passenger(request):
    """
    Creates passenger if they already don't exist
    """

    if Passenger.objects.filter(uid=request.user.id).exists():
        return Response({"error": "exists"}, status=status.HTTP_404_NOT_FOUND)
    else:
        user = CarpoolUser.objects.get(id=request.user.id)
        name = f"{user.first_name} {user.last_name[0]}."
        passenger_data = {"name": name, "uid": request.user}
        passenger = PassengerSerializer(data=passenger_data)
        passenger.create(passenger_data)

        return Response(status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_trip(request):
    """
    Creates trip for driver, which passengers can search for.
    """

    if request.method == 'POST': 
        if request.user.status == "available":
            driver = Driver.objects.get(uid=request.user.id)

            trip = TripSerializer({"driver_id": driver, **request.data})
            trip = trip.create({"driver_id": driver, **request.data}) 
            
            request.user.current_trip = trip
            request.user.status = "driver_busy"
            request.user.save()
            return Response({"tripID": trip.id, "driverID": driver.id, "ETA": trip.ETA}, status=status.HTTP_200_OK)
        return Response({"error": "You already have an ongoing trip."})

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_trip(request):
    """
    Driver sends this request to cancel/end their current trip.
    This sets the driver and all passengers statuses to "available" and removes their current_trip.
    It returns a list of user ids of all the people who were in the trip, which is used in frontend to remove from Firebase database also.
    """

    if request.method == "POST":
        if request.user.status != "available":
            trip = request.user.current_trip

            people = CarpoolUser.objects.filter(current_trip=trip.id)

            ids_list = []
            for user in people:  # remove trip for all users involved in the trip
                ids_list.append(user.id)
                user.status = "available"
                user.current_trip = None
                user.save()

            trip.delete()
            return Response({"uids": ids_list}, status=status.HTTP_200_OK)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_trips(request):
    """
    Used by passengers to search for trips.
    Takes in passenger locations from request.
    Checks if passenger is going to or from DCU, and only filters from those specific trips.

    Uses Google Distance API to get route info for each trip after adding passenger to waypoints, using get_route_details.
    Sends back list of trips in order of the ETA they would have if passenger joined them.
    """

    dcu_campuses = {
        "gla": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
        "pat": "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland"
    }

    if request.method == 'POST':
        passenger = CarpoolUser.objects.get(id=request.user.id)

        if passenger.status == "busy":
            return Response({"error": "You already have an ongoing trip."})

        passenger_start_dcu = request.data["start"]["name"] in dcu_campuses.values()

        active_driver_users = CarpoolUser.objects.exclude(current_trip=None)

        active_trip_id_list = [driver.current_trip.id for driver in active_driver_users if
                               driver.current_trip.id != None]
        if passenger_start_dcu:
            active_trips = Trip.objects.filter(id__in=active_trip_id_list).filter(start__name__in=dcu_campuses.values())
        else:
            active_trips = Trip.objects.filter(id__in=active_trip_id_list).filter(
                destination__name__in=dcu_campuses.values())

        sorted_trips = active_trips.order_by("time_of_departure")
        final_list = []
        for trip in sorted_trips:
            if passenger_start_dcu and (trip.start["name"] in dcu_campuses.values()):
                updated_trip = get_route_details(trip, request.data["destination"]["name"])

            elif (request.data["destination"]["name"] in dcu_campuses.values()) \
                    and (trip.destination["name"] in dcu_campuses.values()):
                updated_trip = get_route_details(trip, request.data["start"]["name"])

            final_list.append(updated_trip)

        final_sorted_list = sorted(final_list, key=lambda t: t.ETA)

        trips_serialized = json.loads(django_serializers.serialize("json", final_sorted_list))

        for index, trip in enumerate(trips_serialized):
            driver_name = Driver.objects.get(id=trips_serialized[index]["fields"]["driver_id"]).name

            if not request.data["isPassengerToDCU"]:
                is_campus_same = request.data["start"]["name"] == trip["fields"]["start"]["name"]
            else:
                is_campus_same = request.data["destination"]["name"] == trip["fields"]["destination"]["name"]

            trips_serialized[index] = {
                "pk": trip["pk"], "driver_name": driver_name, "isCampusSame": is_campus_same, **trip["fields"]
            }

        return Response(trips_serialized, status=status.HTTP_200_OK)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def join_trip(request): 
    """
    Used by passengers to get trip data when a passengers request to a driver is accepted.
    Also used by drivers to get trip data when a passenger leaves the trip.
    """
    if request.method == "GET":
        if Trip.objects.filter(id=request.user.current_trip.id).exists():
            trip = Trip.objects.get(id=request.user.current_trip.id)
            trip_dict = model_to_dict(trip)
            trip_dict["driverPhone"] = trip.driver_id.uid.phone_no
            trip_dict["car"] = model_to_dict(trip.driver_id.car)
            trip_dict["driverName"] = f"{trip.driver_id.uid.first_name} {trip.driver_id.uid.last_name}."
            passenger_route = {}

            """
            If user is a passenger in a trip
            gathers their personalised trip information including personalised times and locations and sends in response.
            This is used in frontend to show each passenger their personalised departure/arrival times
            """

            if request.user.status == "passenger_busy":
                passenger_info = trip_dict["passengers"][f"passenger{request.user.id}"]
                dcu_campuses = ["Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
                                "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland"]
                # If trip is TO DCU
                if trip_dict["start"]["name"] not in dcu_campuses:
                    passenger_loc = passenger_info["passengerStart"]
                    route_info = [r for r in trip_dict["route"]["route"] if r["start"] == passenger_loc][0]
                    passenger_route = {
                        "passengerDestLoc": trip_dict["destination"]["name"],
                        "passengerArrivalTime": trip_dict["ETA"].strftime("%Y-%m-%dT%H:%M"),
                        "passengerStartLoc": route_info["start"],
                        "passengerDepartureTime": datetime.strptime(str(route_info["departure_time"]),
                                                                    "%H:%M %m/%d/%Y"),
                    }

                # If trip is FROM DCU
                else:
                    passenger_loc = passenger_info["passengerDestination"]
                    route_info = [r for r in trip_dict["route"]["route"] if r["destination"] == passenger_loc][0]
                    passenger_route = {
                        "passengerDestLoc": route_info["destination"],
                        "passengerArrivalTime": datetime.strptime(str(route_info["arrival_time"]), "%H:%M %m/%d/%Y"),
                        "passengerStartLoc": trip_dict["start"]["name"],
                        "passengerDepartureTime": trip_dict["time_of_departure"].strftime("%Y-%m-%dT%H:%M"),
                    }

            return Response({"trip_data": trip_dict, "passenger_route": passenger_route}, status=status.HTTP_200_OK)

        return Response({"error": "Trip no longer exists."}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)


def get_route_details(trip, passenger_location="", passenger_secondary_location=""):
    """
    Used to get route details such as total distance, total duration, ETA, optimal waypoint order of a route.
    This is used whenever a user requests map data.
    """

    if len(trip.waypoints) < 1:
        waypoints = ""
    else:
        print(trip.waypoints.values())
        waypoints = "|".join([wp["name"] for wp in trip.waypoints.values()])

    directions_base_url = "https://maps.googleapis.com/maps/api/directions/json"
    directions_url = urllib.parse.quote(
        f"{directions_base_url}?destination={trip.destination['name']}&origin={trip.start['name']}&waypoints=optimize:true|{waypoints}|{passenger_location}|{passenger_secondary_location}&key={settings.GOOGLE_API_KEY}",
        safe='=?:/&'
    )


    previous_waypoint_order = {}
    wp_list = list(trip.waypoints.values())
    
    i = 0
    while i < len(wp_list):
        """
        A issue with Google Directions API is that it automatically converts the address names, 
        here we solve this by preserving the previous waypoint order names and use the new waypoint order to get back 
        the new waypoint order with preserved names as they were before the API request below.
        """
        previous_waypoint_order[i] = wp_list[i]["name"]
        i += 1
    
    if passenger_location != "":
        previous_waypoint_order[i] = passenger_location

    response = requests.get(directions_url)

    waypoint_order = response.json()["routes"][0].get("waypoint_order")

    distance_calculation = 0
    duration_calculation = 0
    departure_time = datetime.timestamp(trip.time_of_departure)
    route = []
    # Gets the distance and duration between each waypoint in the trip.
    # Also gets the departure time and arrival time to destination/from start.
    # This data is used by frontend to display personalised ETA / Departure times to each passenger in trip.
    for leg in response.json()["routes"][0]["legs"]:
        arrival_time = departure_time + int(leg["duration"]["value"])
        waypoint_info = {
            "start": leg["start_address"],
            "destination": leg["end_address"],
            "distance": leg["distance"]["text"],
            "duration": leg["duration"]["text"],
            "departure_time": datetime.fromtimestamp(departure_time).replace(microsecond=0).strftime("%H:%M %m/%d/%Y"),
            "arrival_time": datetime.fromtimestamp(arrival_time).replace(microsecond=0).strftime("%H:%M %m/%d/%Y")
        }

        if "km" in leg["distance"]["text"]:
            distance_calculation += float(leg["distance"]["text"].replace(",", "")[:-3])
        else:
            distance_calculation += float(leg["distance"]["text"][:-2]) // 1000

        duration_calculation += int(leg["duration"]["value"])

        departure_time += int(leg["duration"]["value"])

        # shows distance & duration between waypoints
        route.append(waypoint_info)

    # gets the order of the waypoints based on response from Directions API.
    route[0]["start"] = trip.start["name"]
    i = 0
    while i < len(route) - 1:
        route[i]["destination"] = previous_waypoint_order[waypoint_order[i]]
        route[i + 1]["start"] = previous_waypoint_order[waypoint_order[i]]
        i += 1

    route[-1]["destination"] = trip.destination["name"]

    trip_time = timedelta(seconds=duration_calculation)
    eta = trip.time_of_departure + trip_time

    duration_calculation = str(timedelta(seconds=duration_calculation)).split(":")
    total_duration = f"{duration_calculation[0]} hours, {duration_calculation[1].lstrip('0')} min, {duration_calculation[2]} sec"

    # removes .0 from distance
    if str(distance_calculation)[-1] == "0":
        total_distance = str(distance_calculation)[:-2] + " km"
    else:
        total_distance = str(round(distance_calculation, 1)) + " km"

    trip.distance = total_distance
    trip.duration = total_duration
    trip.ETA = eta.replace(microsecond=0)
    trip.route = {"route": route}

    return trip


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_passenger_to_trip(request):
    """
    Request sent by Driver to add passenger to a trip if they have no ongoing trips.
    Updates driver trip data such as waypoints, passengers, available_seats.
    Also calls get_route_details to get new ETA/departure times for all other passengers and driver.
    """

    dcu_campuses = {
        "gla": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
        "pat": "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland"
    }

    if request.method == "POST":
        passenger_start = request.data["passengerData"]["passengerStart"]
        passenger_dest = request.data["passengerData"]["passengerDestination"]
        trip_id = request.data.get("tripID")
        if CarpoolUser.objects.filter(id=request.data["passengerData"]["id"]).exists():
            passenger_user = CarpoolUser.objects.get(id=request.data["passengerData"]["id"])
            if Trip.objects.filter(id=trip_id).exists():
                trip = Trip.objects.get(id=trip_id)
                if trip.passengers.get(f"passenger{passenger_user.id}") is None:
                    passenger_user.current_trip = trip  
                    passenger_user.status = "passenger_busy" 
                else:
                    return Response({"error": "passenger already in the same trip."}, status=status.HTTP_400_BAD_REQUEST)

                trip.passengers[f"passenger{passenger_user.id}"] = {
                    "passengerName": f"{passenger_user.first_name} {passenger_user.last_name[0]}.",
                    "passengerID": request.data["passengerData"]["id"],
                    "passengerStart": passenger_start["name"],
                    "passengerDestination": passenger_dest["name"],
                }

                same_campus = (trip.start["name"] == passenger_start["name"]) or \
                              (trip.destination["name"] == passenger_dest["name"])

                if (trip.start["name"] in dcu_campuses.values()) and (passenger_start["name"] in dcu_campuses.values()): 
                    trip.waypoints[f"waypoint{len(trip.waypoints) + 1}"] = { 
                        "name": passenger_dest["name"],
                        "passenger": f"{passenger_user.first_name} {passenger_user.last_name[0]}.",
                        "lat": passenger_dest["lat"],
                        "lng": passenger_dest["lng"],
                    }
                    trip.passengers[f"passenger{passenger_user.id}"]["passengerStart"] = trip.start["name"]

                elif (trip.destination["name"] in dcu_campuses.values()) and (passenger_dest["name"] in dcu_campuses.values()):
                    trip.waypoints[f"waypoint{len(trip.waypoints)+1}"] = {
                        "name": passenger_start["name"],
                        "passenger": f"{passenger_user.first_name} {passenger_user.last_name[0]}.",
                        "lat": passenger_start["lat"],
                        "lng": passenger_start["lng"],
                    }
                    trip.passengers[f"passenger{passenger_user.id}"]["passengerDestination"] = trip.destination["name"]

                trip.available_seats -= 1
                route_details = get_route_details(trip)
                trip_data = model_to_dict(route_details)

                passenger_user.save()
                route_details.save()
                return Response({"trip_data": trip_data, "is_same_campus": same_campus}, status=status.HTTP_200_OK)

            return Response({"error": "Trip no longer exists."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": "Passenger does not exist"}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def end_trip(request):
    """
    Used by driver to end a trip
    """
    if request.method == "POST":
        trip_id = request.data.get("tripID")
        if Trip.objects.filter(id=trip_id).exists():
            people = CarpoolUser.objects.filter(current_trip=trip_id)

            ids_list = []
            for user in people:  # removes any passengers involved in the trip
                ids_list.append(user.id)
                user.status = "available"
                user.current_trip = None
                user.save()

            return Response({"uids": ids_list}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Trip does not exist."}, status=status.HTTP_404_NOT_FOUND)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def passenger_leave_trip(request):
    """
    Used by passengers to leave trip if they are in one.
    Updates driver trip data such as waypoints, passengers, available_seats.
    Also calls get_route_details to get new ETA/departure times for all other passengers and driver.
    """

    if request.method == "GET":
        passenger = request.user
        if passenger.current_trip is not None:
            trip = passenger.current_trip

            temp_passengers_dict = {**trip.passengers}
            locations_count = {}

            for key, passenger in trip.passengers.items():
                # prevents removing leaving passengers waypoints if other passengers have it as well
                if passenger["passengerStart"] not in locations_count:
                    locations_count[passenger["passengerStart"]] = 1
                else:
                    locations_count[passenger["passengerStart"]] += 1

                if passenger["passengerDestination"] not in locations_count:
                    locations_count[passenger["passengerDestination"]] = 1
                else:
                    locations_count[passenger["passengerDestination"]] += 1

                temp_waypoints_dict = {**trip.waypoints}
                if int(passenger["passengerID"]) == request.user.id:
                    temp_passengers_dict.pop(key)
                    passenger_start = passenger["passengerStart"]
                    passenger_destination = passenger["passengerDestination"]
                    for waypoint_key, waypoint in trip.waypoints.items():
                        if waypoint["name"] == passenger_start or waypoint["name"] == passenger_destination:
                            if locations_count[waypoint["name"]] == 1:
                                temp_waypoints_dict.pop(waypoint_key)
                                locations_count[waypoint["name"]] = 0

                    trip.waypoints = temp_waypoints_dict

            passenger = request.user

            trip.passengers = temp_passengers_dict
            trip.available_seats += 1

            route_details = get_route_details(trip)
            route_details.save()

            passenger.current_trip = None
            passenger.status = "available"
            passenger.save()
            return Response({"status": "Passenger removed from trip.", "available_seats": trip.available_seats}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Passenger does not have an active trip."}, status=status.HTTP_400_BAD_REQUEST)

    return Response(status=status.HTTP_400_BAD_REQUEST)
