
## Carpool app for DCU students on Android
___

Description
---
This is app is for DCU students looking to share a ride with other DCU students built using Django and React Native (expo-cli and TypeScript).
Students can select to go from DCUs campuses to a location or from a location to one of DCUs campuses. Students meet up with other students based on their interests/constraints, such as no smoking, or an interest in talking about sport.
The intention of the app is to give students another way to socialise and to get to or from DCU.

How it works, drivers would first input their start and destination, then their interests/constraints,
then the app takes that information and shows these drivers to passengers based on both of their interests/constraints, showing the optimal routes.
The passenger would then pick a driver based on those routes and interests/constraints and a request would be sent to the driver which can be accepted or denied.
When a driver accepts a request a ride is shared.

Packages/References
---

### Backend

Here are the list of packages that have been used so far for the backend.

>- [Django](https://www.djangoproject.com/)
>- [Django REST framework](https://www.django-rest-framework.org/)
>- [django-cors-headers](https://pypi.org/project/django-cors-headers/)
>- [phonenumbers](https://pypi.org/project/phonenumbers/)

These can be found in [requirements.txt](src/carpool-app/backend/requirements.txt) in the backend directory in src/carpool-app.

### Frontend

For packages used for the frontend in React Native, see [package.json](src/carpool-app/frontend/package.json)