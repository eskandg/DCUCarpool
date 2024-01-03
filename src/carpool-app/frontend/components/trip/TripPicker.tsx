import {Box, Button, Heading, HStack, Icon, Text, View, VStack} from "native-base";
import TripAlertModal from "./TripAlertModal";
import {SwipeablePanel} from "rn-swipeable-panel";
import {StyleSheet, TouchableOpacity} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {v4} from "uuid";
import {storeTripRequest, useAppDispatch, useAppSelector, timedate} from "../../hooks";
import {setTimeOfDeparture, updateTripState} from "../../reducers/trips-reducer";
import {updateStatus, updateTripRequestStatus} from "../../reducers/user-reducer";
import {useState} from "react";
import {get, getDatabase, ref} from "firebase/database";
import {heightPercentageToDP, widthPercentageToDP} from "react-native-responsive-screen";
import Profile from "../user/Profile";

// Component shows the list of available trips to passengers in a SwipeablePanel, when they press "Show Trips" at bottom of passenger screen.
function TripPicker({showTripAvailableModal, setShowTripAvailableModal, filteredTrips, setFilteredTrips, setPreviousTripID, isTripToDCU}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const [isPanelActive, setIsPanelActive] = useState(false);
    const [tripsFound, setTripsFound] = useState<object | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);

    const dcuCampuses = {
        "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9": "DCU Glasnevin",
        "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland": "DCU St.Pat's"
    };

    // sets panel to open
    const openPanel = () => {
        setIsPanelActive(true);
    };
    // sets panel to closed
    const closePanel = () => {
        setIsPanelActive(false);
    };

    // for passenger only
    // sends passengers trip data as POST request to backend API /get_trips to get ordered list of available trips.
    const searchTrips = () => {
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
            duration: trips.duration,
            distance: trips.distance,
            time_of_departure: trips.timeOfDeparture !== "" ? new Date(trips.timeOfDeparture) : new Date(),
            isPassengerToDCU : isTripToDCU,
        };

        if (trips.timeOfDeparture === "") {
            dispatch(setTimeOfDeparture(new Date().toString()))
        }

        fetch(`${backendURL}/get_trips`, {
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
                console.log("Searching for Trips...");
                // filters out trips that have already departed
                get(ref(db, `/trips`)).then((snapshot) => {
                    if (snapshot.val() != null) {
                        let tripsFiltered = new Set();
                        Object.keys(snapshot.val()).map((tripKey) => {
                            let trip = snapshot.val()[tripKey];
                            if (trip.status === "departed" || trip.availableSeats < 1)  {
                                tripsFiltered.add(parseInt(tripKey));
                            }
                        })
                        setFilteredTrips(tripsFiltered);
                    }
                    else {
                       setFilteredTrips(new Set());
                    }
                });

                setTripsFound(res);
            }
            else {
                console.log(res.errorType, res.errorMessage);
            }
        })
    }

    // request function is called when passenger presses the "request" button on a trip
    // it creates a new request in the firebase database using the passengers trip locations
    const request = (trip) => {

        let passengerData = {
          passengerID: user.id,
          name: `${user.firstName} ${user.lastName.charAt(0)}.`,
          startLocation: {
              name: trips.locations.startingLocation.marker.description,
              coords: trips.locations.startingLocation.info.coords
          },
          destination: {
              name: trips.locations.destLocation.marker.description,
              coords: trips.locations.destLocation.info.coords
          }
        }
        // adds trip request to Firebase
        storeTripRequest(trip.pk, passengerData).then((isStored) => {
          if (!filteredTrips.has(`${trip.pk}`) && isStored) {
              setPreviousTripID(trips.id);
              dispatch(updateTripState({id: trip.pk, driverName: trip.driver_name}));

              dispatch(updateTripRequestStatus("waiting"));
              dispatch(updateStatus("passenger_busy"));
          }

          if (!isStored) {
              setTripsFound({});
          }

          setShowTripAvailableModal(!isStored)
        })

    }

    return (
        // only shows Trip Picker when passenger presses "show trips"
        (trips.role === "passenger" && user.status === "available" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered ?
              <>
                  {(user.tripRequestStatus === undefined || user.tripRequestStatus === "") &&
                      <Button onPress={() => {
                          openPanel();
                          searchTrips();
                      }}>
                          Show Trips
                      </Button>
                  }

                  {/* Shows error message as modal if passenger requests a trip that has already departed */}
                  {showTripAvailableModal &&
                    <TripAlertModal
                        headerText="Request Alert"
                        bodyText={`Trip is no longer available.\nPress OK to refresh the list.`}
                        btnAction={
                            {
                                action: () => {
                                    setShowTripAvailableModal(false);
                                    searchTrips();
                                },
                                text: "OK"
                            }
                        }
                    />
                  }
                  {/* Panel containing list of trips */}
                  <SwipeablePanel
                      style={{zIndex: 2, elevation: 2, maxHeight: heightPercentageToDP("85%"), minWidth: widthPercentageToDP("100%")}}
                      scrollViewProps={{style: {padding: 10, zIndex: 2, elevation: 2}}}
                      fullWidth={true}
                      openLarge={true}
                      closeOnTouchOutside={true}
                      isActive={isPanelActive}
                      showCloseButton={true}
                      onPressCloseButton={() => {
                        closePanel();
                      }}
                      onClose={() => {
                        setIsPanelActive(false);
                      }}
                  >
                      <HStack space={2} alignItems="center" mb={2}>
                          <Heading>Nearby Drivers</Heading>
                          <TouchableOpacity onPress={() => {searchTrips()}}>
                              <Icon as={Ionicons} name={"reload"} size={25} color="grey"/>
                          </TouchableOpacity>
                      </HStack>

                      {tripsFound !== null &&
                          // Loops over each trip in tripsFound
                          Object.keys(tripsFound).map((tripKey) => {
                              let sameCampusColorCondition = tripsFound[tripKey].isCampusSame ? "green.800" : "orange.400";
                              return (
                                  // Displays trip info
                                  !filteredTrips.has(tripsFound[tripKey].pk) &&
                                  <Box key={v4()} style={styles.tripButton} bg="light.50" rounded={20} shadow={0}>
                                          <HStack alignItems="center">
                                              <VStack maxWidth="75%">
                                                  <HStack alignItems="center" mb={2}>
                                                      <View marginRight={5}>
                                                          <VStack alignItems="center">
                                                              <Profile uid={tripsFound[tripKey].driver_id} mode="iconModal"/>
                                                              <Text mt="1" style={{fontWeight: "bold", fontSize: heightPercentageToDP("2.5%")}}>
                                                                  {tripsFound[tripKey].driver_name}
                                                              </Text>
                                                              <Button mt={1} onPress={() => {request(tripsFound[tripKey])}}>Request</Button>
                                                          </VStack>
                                                      </View>

                                                      <VStack>
                                                          <HStack alignItems="center" space={1}>
                                                              <Heading size={"md"}>From</Heading>
                                                              {/* if trip is from DCU, shows icon next to start location*/}
                                                              {!isTripToDCU &&
                                                                  <Icon as={Ionicons} color={sameCampusColorCondition} name="ellipse" size={heightPercentageToDP("3%")}/>
                                                              }
                                                          </HStack>

                                                            <Text>
                                                                {tripsFound[tripKey].start.name in dcuCampuses ? dcuCampuses[tripsFound[tripKey].start.name] : tripsFound[tripKey].start.name}
                                                            </Text>

                                                          <HStack alignItems="center" space={1} mt={1}>
                                                              <Heading size={"md"}>To</Heading>
                                                              {/* if trip is to DCU, shows icon next to Destination */}
                                                              {isTripToDCU &&
                                                                  <Icon as={Ionicons} color={tripsFound[tripKey].isCampusSame ? "green.800" : "orange.400"} name="ellipse" size={heightPercentageToDP("3%")}/>
                                                              }
                                                          </HStack>
                                                          <Text>
                                                              {tripsFound[tripKey].destination.name in dcuCampuses ? dcuCampuses[tripsFound[tripKey].destination.name] : tripsFound[tripKey].destination.name}
                                                          </Text>
                                                      </VStack>

                                                  </HStack>

                                                  <Text fontWeight="bold">Departing at:{"  "}{timedate(tripsFound[tripKey].time_of_departure)}</Text>
                                                  <Text fontWeight="bold">ETA at:{"  "}{timedate(tripsFound[tripKey].ETA)}</Text>
                                              </VStack>

                                          </HStack>

                                  </Box>
                              );
                          }
                      )}

                  </SwipeablePanel>
              </>

             : <></>)
    )
}

const styles = StyleSheet.create({
  tripButton: {
      borderBottomColor: "#e4e4eb",
      borderTopColor: "#e4e4eb",
      borderBottomWidth: 0.5,
      borderTopWidth: 0.5,
      flex: 1,
      flexGrow: 1,
      padding: 15,
  }
});


export default TripPicker;