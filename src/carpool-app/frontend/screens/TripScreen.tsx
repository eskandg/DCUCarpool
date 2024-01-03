import {StyleSheet, View} from "react-native";
import {useEffect, useRef, useState} from "react";
import "react-native-get-random-values";

import {updateStatus, updateUserState, updateTripRequestStatus, updateTripStatus} from "../reducers/user-reducer";
import {setNumberOfWaypoints, setTimeOfDeparture, updateTripState, resetTripState} from "../reducers/trips-reducer";
import {useAppDispatch, useAppSelector, createFirebaseTrip, createLocationObj} from "../hooks";
import {Button, Text, Box, KeyboardAvoidingView} from "native-base";
import {getDatabase, onValue, off, ref} from "firebase/database";

// @ts-ignore
import getDirections from "react-native-google-maps-directions";
import LocationInputGroup from "../components/trip/LocationInputGroup";
import {shallowEqual} from "react-redux";
import Map from "../components/trip/Map";
import TripRequestsModal from "../components/trip/TripRequestsModal";
import TripPicker from "../components/trip/TripPicker";
import DriverCurrentTrip from "../components/trip/DriverCurrentTrip";
import PassengerCancelRequestButton from "../components/trip/PassengerCancelRequestButton";
import TripScreenAlertModals from "../components/trip/TripScreenAlertModals";
import NumOfSeatsAndDepartureTimeCollapsible from "../components/trip/NumOfSeatsAndDepartureTimeCollapsible";
import PassengerCurrentTrip from "../components/trip/PassengerCurrentTrip";
import {heightPercentageToDP, widthPercentageToDP} from "react-native-responsive-screen";
import {showNumberOfSeatsAndTimePicker, showWaypoints} from "../reducers/collapsibles-reducer";

// Trip Screen
function TripScreen() {
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips, shallowEqual);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);

    const [filteredTrips, setFilteredTrips] = useState(new Set());
    const [passengerGotInitialMapData, setPassengerGotInitialMapData] = useState(false);
    const [isResetAfterTripComplete, setIsResetAfterTripComplete] = useState(false);
    const [firebaseTripsVal, setFirebaseTripsVal] = useState({tripID: null, driverID: null, data: {trip: {status: "waiting", passengers: {}}, tripRequests: {}}});;
    const [isPassengerInTrip, setIsPassengerInTrip] = useState<boolean>(false);
    const [previousTripID, setPreviousTripID] = useState(null);
    const [showTripAvailableModal, setShowTripAvailableModal] = useState(false);
    const [isTripToDCU, setIsTripToDCU] = useState<boolean | undefined>(undefined);
    const [campusSelected, setCampusSelected] = useState("");
    const [hideMap, setHideMap] = useState(false);

    // firebase db
    const db = getDatabase();

    // for driver only used to add waypoint to driver journey
    // creates new location obj to display on map
    const increaseWaypoints = () => {
        let activeWaypoints = Object.keys(trips.locations).filter((key) => trips.locations[key].marker.description && trips.locations[key].type === "waypoint" && trips.locations[key].info.isEntered)
                                .map((key) => trips.locations[key].marker.description);

        if (trips.numberOfWaypoints < 4) {
            if ((trips.numberOfWaypoints - activeWaypoints.length) === 0) {
                dispatch(setNumberOfWaypoints(trips.numberOfWaypoints + 1));

            } else {
                console.log("error: fill waypoint field before adding another");
            }
        } else {
            console.log("error: too many waypoints");
        }
    }


    // for driver only, used when they press, create trip
    // sends POST request with trip data to backend /create_trip URL, which adds trip to Django database.
    // also creates trip in Firebase database
    const createTrip = () => {
        let waypoints = {};

        Object.keys(trips.locations).sort().map((locationKey) => {
            if (trips.locations[locationKey].type === "waypoint" && trips.locations[locationKey].info.isEntered) {
                waypoints[locationKey] = {name: trips.locations[locationKey].marker.description, type: "driver", ...trips.locations[locationKey].info.coords}
            }
        })

        let initialETA;
        if (trips.timeOfDeparture === "") {
            initialETA = new Date()
        } else {
            initialETA = new Date(trips.timeOfDeparture)
        }

        initialETA.setSeconds(initialETA.getSeconds() + trips.initialDurationSeconds)

        let trip_data = {
            start: {
                name: trips.locations.startingLocation.marker.description,
                lng: trips.locations.startingLocation.info.coords.lng,
                lat: trips.locations.startingLocation.info.coords.lat
            },
            destination: {
                name: trips.locations.destLocation.marker.description,
                lng: trips.locations.destLocation.info.coords.lng,
                lat: trips.locations.destLocation.info.coords.lat
            },
            waypoints: waypoints,
            passengers: {},
            available_seats: trips.availableSeats,
            duration: trips.duration,
            distance: trips.distance,
            time_of_departure: trips.timeOfDeparture !== "" ? new Date(trips.timeOfDeparture) : new Date(),
            ETA: initialETA,
        };

        if (trips.timeOfDeparture === "") {
            dispatch(setTimeOfDeparture(new Date().toString()));
        }
        // request to backend
        if (user.status === "available") {
            fetch(`${backendURL}/create_trip`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${user.token}`
                },
                body: JSON.stringify(trip_data)
            }).then(response => response.json())
                .then(res => {
                    if (!("errorType" in res)) {
                        // creates trip in Firebase
                        let isFirebaseTripCreated = createFirebaseTrip(user.status, trip_data.available_seats, res.tripID, res.driverID, `${user.firstName} ${user.lastName[0]}.`);
                        if (isFirebaseTripCreated) {
                            dispatch(updateStatus("driver_busy"));
                        }
                        dispatch(showWaypoints(false));
                        dispatch(showNumberOfSeatsAndTimePicker(false));
                        setPreviousTripID(trips.id)
                        dispatch(updateTripState({id: res.tripID, ETA: res.ETA}));
                        setFirebaseTripsVal({tripID: res.tripID, driverID: res.driverID, data: {trip: {}, tripRequests: {}}});
                    } else {
                        console.log(res.errorType, res.errorMessage);
                    }
                })
        }
    }
    // function used to store trip data from JSON backend response to redux trip data
    const convertTripDataFromJSON = (tripData, passengerRoute) => {
        if (tripData !== undefined) {

            let newWaypoints = {};

            // creates waypoint locations
            if (Object.keys(tripData["waypoints"]).length > 0) {
                Object.keys(tripData["waypoints"]).map((key) => {
                    newWaypoints[key] = createLocationObj(key,
                        "waypoint",
                        tripData["waypoints"][key].passenger === undefined ? "Driver Stop" : tripData["waypoints"][key].passenger,
                        {lat: tripData["waypoints"][key].lat, lng: tripData["waypoints"][key].lng},
                        tripData["waypoints"][key].name,
                    true
                    )
                });
            }
            // stores trip data in redux
            dispatch(updateTripState({
                ...tripData,
                ...passengerRoute, // sets pasengerRoute information including personalised times (sent from backend response)
                locations: {
                    startingLocation: createLocationObj(
                        "startingLocation",
                        "start",
                        "Starting Point",
                        {lat: tripData["start"].lat, lng: tripData["start"].lng},
                        tripData["start"].name, true
                    ),
                    destLocation: createLocationObj(
                        "destLocation",
                        "destination",
                        "Destination Point",
                        {lat: tripData["destination"].lat, lng: tripData["destination"].lng},
                        tripData["destination"].name,
                        true
                    ),
                    ...newWaypoints,
                },
                availableSeats: tripData["available_seats"],
                timeOfDeparture: tripData["time_of_departure"],
                numberOfWaypoints: Object.keys(tripData["waypoints"]).length
            }))
        }
    }

    // used by passenger to get trip information after their request is accepted by driver.
    // used by passenger and driver to get updated trip information whenever a passenger joins/leaves the trip
    // sends request to backend /join_trip url
    const getOrJoinTrip = () => {
        fetch(`${backendURL}/join_trip`, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            }
        }).then(response => response.json())
            .then((res) => {
                if (!("error" in res)) {
                    // sets trip information based on response
                    if (res.trip_data !== null) {
                        convertTripDataFromJSON(res.trip_data, res.passenger_route);
                    }
                    if (trips.role === "passenger" && !passengerGotInitialMapData) {
                        setIsPassengerInTrip(true);
                        setPassengerGotInitialMapData(true);
                        dispatch(updateUserState({status: "passenger_busy"}));
                    }
                }
                else {
                    if (trips.role === "passenger") {
                        setIsPassengerInTrip(false);
                    }
                    console.log(res.error);
                }
            })
    }


    useEffect(() => {
        setPreviousTripID(trips.id);
    }, [])

    // firebase listeners to update trip data in real time
    // handles trip requests
    useEffect(() => {
        let tempFbTripsVal = {...firebaseTripsVal}

        if (previousTripID !== null) {
            off(ref(db, `/tripRequests/${previousTripID}`));
            off(ref(db, `/trips/${previousTripID}/passengers/`));
            off(ref(db, `/trips/${previousTripID}/status`));
            off(ref(db, `/trips/${previousTripID}`));
            setPreviousTripID(trips.id);

            onValue(ref(db, `/tripRequests/${trips.id}`), (snapshot) => {
                tempFbTripsVal = {
                    ...tempFbTripsVal,
                    data: {
                        ...tempFbTripsVal.data,
                        tripRequests: snapshot.val() !== null ? snapshot.val() : {}
                    }
                };

                setFirebaseTripsVal(tempFbTripsVal);
            })

            onValue(ref(db, `/trips/${trips.id}/status`), (snapshot) => {
                tempFbTripsVal = {
                    ...tempFbTripsVal,
                    data: {
                        ...tempFbTripsVal.data,
                        trip: {
                            ...tempFbTripsVal.data.trip,
                            status: snapshot.val()
                        }
                    }
                }

                setFirebaseTripsVal(tempFbTripsVal);
            })

            onValue(ref(db, `/trips/${trips.id}/passengers/`), (snapshot) => {
                tempFbTripsVal = {
                    ...tempFbTripsVal,
                    data: {
                        ...tempFbTripsVal.data,
                        trip: {
                            ...tempFbTripsVal.data.trip,
                            passengers: snapshot.val()
                        }
                    }
                }
                // stores up to date firebase trip data
                setFirebaseTripsVal(tempFbTripsVal)

                if (trips.role === "passenger" && typeof snapshot.val() === "object" && snapshot.val() !== null) {
                    if (user.id in snapshot.val()) {
                        setIsPassengerInTrip(true);
                    }
                    else {
                        setIsPassengerInTrip(false);
                    }
                }
            })

            // firebase listener
            // when a new user's status changes in firebase, updates redux appropriately
            onValue(ref(db, `/users/${user.id}/tripRequested`), (snapshot) => {
                if (!passengerGotInitialMapData) {
                    if (snapshot.val() !== null) {
                        if (trips.id === undefined) {
                            dispatch(updateTripState({id: snapshot.val().tripID}));
                        }

                        dispatch(updateTripRequestStatus(snapshot.val().requestStatus));
                        dispatch(updateTripStatus(snapshot.val().status));

                        if (snapshot.val().status === "trip_complete" && !isResetAfterTripComplete) {
                            console.log("Passenger reset.")
                            dispatch(updateUserState({status: "available", tripRequestStatus: undefined}));
                            setIsTripToDCU(undefined);
                            setCampusSelected("");
                            setShowTripAvailableModal(false);
                            setIsResetAfterTripComplete(true);
                        }
                    }
                    else {
                        dispatch(updateTripRequestStatus(undefined));
                        dispatch(updateTripStatus(undefined));
                    }
                }
            })
        }
    }, [trips.id, previousTripID])

    // if passenger is added to a firebase trip,it makes request to backend to get the trip data
    useEffect(() => {
        if (trips.role === "passenger" && user.tripRequestStatus === "accepted" && !passengerGotInitialMapData) {
            if (firebaseTripsVal.data.trip.passengers !== null) {
                if (user.id in firebaseTripsVal.data.trip.passengers) {
                    console.log("passenger in trip!");
                    setHideMap(true);
                    getOrJoinTrip();
                }
            }
        }
        // else passenger has been denied their request
    }, [user.tripRequestStatus])

    // gets up to date trip info from Django, when a passenger adds or leaves their current trip
    useEffect(() => {
        if ((user.status === "passenger_busy" && passengerGotInitialMapData) || user.status === "driver_busy") {
            getOrJoinTrip();
        }
    }, [firebaseTripsVal.data.trip.passengers])

    // resets trip state when status = "available"
    useEffect(() => {
        if (user.status === "available") {
            dispatch(resetTripState());
            setCampusSelected("");
        }
    }, [isTripToDCU])

  return (
        <KeyboardAvoidingView style={styles.container}>
            {user.status === "available" &&
                <View>

                    {/* Component for showing To/From DCU buttons at top of screen and entering a location*/}
                    <LocationInputGroup
                        isTripToDCU={isTripToDCU}
                        setIsTripToDCU={(value) => {setIsTripToDCU(value)}}
                        campusSelected={campusSelected}
                        setCampusSelected={(value) => {setCampusSelected(value)}}
                        increaseWaypoints={() => {increaseWaypoints()}}
                    />
                </View>
            }

            <View style={{flex: 1, elevation: -1, zIndex: -1}}>
                {/* Component to show trip requests */}
                <TripRequestsModal firebaseTripRequests={firebaseTripsVal.data.tripRequests} previousTripID={previousTripID} setPreviousTripID={(prevID) => {setPreviousTripID(prevID)}}/>

                {!hideMap &&
                    <Map/>
                }
                {/* Component for driver selecting number of seats and departure time */}
                <NumOfSeatsAndDepartureTimeCollapsible/>

                {/* Create Trip button for driver */}
                {trips.role === "driver" && user.status !== "driver_busy" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered &&
                      <Button onPress={() => {createTrip();}}>
                        <Text color="white">Create Trip</Text>
                      </Button>
                }

                {/* Component to show current trip info, if driver is in an active trip */}
                {user.status === "driver_busy" &&
                    <DriverCurrentTrip
                        isTripDeparted={firebaseTripsVal.data.trip.status === "departed"}
                        setCampusSelected={(value) => {setCampusSelected(value);}}
                        setIsTripToDCU={(value) => {setIsTripToDCU(value)}}
                    />
                }

                {/* Passenger cancel request button */}
                {trips.role === "passenger" && user.tripRequestStatus === "waiting" ?
                    <Box style={{ width: "100%", height: "100%", backgroundColor:"#5c5c5c", zIndex: 100, elevation: 100, alignSelf: "center", alignItems:"center", justifyContent:"center"}}>
                        <PassengerCancelRequestButton setPreviousTripID={(value) => {setPreviousTripID(value)}} setHideMap={(value) => {setHideMap(value)}}/>
                    </Box>
                : null
                }

                {/* Component to show current trip info, if passenger is in an active trip */}
                <PassengerCurrentTrip
                    isTripToDCU={isTripToDCU}
                    setIsTripToDCU={(value) => {setIsTripToDCU(value)}}
                    setCampusSelected={(value) => {setCampusSelected(value)}}
                    filteredTrips={filteredTrips}
                    isTripDeparted={firebaseTripsVal.data.trip.status === "departed"}
                />

                {/* Component to show/hide alert modals */}
                <TripScreenAlertModals setIsResetAfterTripComplete={(value) => {setIsResetAfterTripComplete(value)}} setHideMap={(value) => {setHideMap(value)}}/>
            </View>

            {/* Component showing list of trips for Passenger after pressing show trips*/}
            <TripPicker
                 setPreviousTripID={(prevID) => {setPreviousTripID(prevID)}}
                 filteredTrips={filteredTrips}
                 setFilteredTrips={(value) => {setFilteredTrips(value)}}
                 showTripAvailableModal={showTripAvailableModal}
                 setShowTripAvailableModal={(value) => {setShowTripAvailableModal(value)}}
                 isTripToDCU={isTripToDCU}
            />

      </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
    height: heightPercentageToDP("100%"),
    width: widthPercentageToDP("100%"),
    backgroundColor: '#fff',
  },
  googlePlacesSearch: {
      flex: 0,
      fontSize: 20
  },
});

export default TripScreen;
