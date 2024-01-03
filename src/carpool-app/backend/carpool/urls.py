from . import views
from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("register", views.register, name="register"),
    path("login", views.login, name="login"),
    path("logout", views.logout, name="logout"),
    path("token", obtain_auth_token, name="api-auth-token"),
    path("delete", views.delete_account, name="delete-account"),
    path("get_profile", views.get_profile, name="get-profile"),
    path("set_profile_description", views.set_profile_description, name="set-profile-description"),
    path("update_phone", views.update_phone, name="update-phone"),
    path("get_driver", views.get_driver, name="get-driver"),
    path("create_driver", views.create_driver, name="create-driver"),
    path("create_passenger", views.create_passenger, name="create-passenger"),
    path("create_trip", views.create_trip, name="create-trip"),
    path("remove_trip", views.remove_trip, name="remove-trip"),
    path("get_trips", views.get_trips, name="get-trips"),
    path("add_passenger_to_trip", views.add_passenger_to_trip, name="add-passenger-to-trip"),
    path("join_trip", views.join_trip, name="join-trip"),
    path("end_trip", views.end_trip, name="end-trip"),
    path("passenger_leave_trip", views.passenger_leave_trip, name="passenger-leave-trip"),
]
