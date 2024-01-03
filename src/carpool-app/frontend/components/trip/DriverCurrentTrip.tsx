import {View} from "react-native";
import {Button, Heading, Text, Box, HStack, VStack} from "native-base";
import {getDatabase, get, ref, remove, update} from "firebase/database";
import {removeFirebaseTrip, useAppDispatch, useAppSelector, timedate} from "../../hooks";
import {updateStatus} from "../../reducers/user-reducer";
import {useState} from "react";
import TripAlertModal from "./TripAlertModal";
import TripPassengers from "./TripPassengers";
import {widthPercentageToDP} from "react-native-responsive-screen";

// Driver Current Trip component
// Displays information to driver about their trip
function DriverCurrentTrip({isTripDeparted, setIsTripToDCU, setCampusSelected}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);

    const dcuCampuses = {
        "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9": "DCU Glasnevin",
        "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland": "DCU St.Pat's"
    };

    const [isCancelTripPressed, setIsCancelTripPressed] = useState(false);

    // Function for driver to  cancel trip
    // sends post request to backend /remove_trip URL to remove trip from Django database
    // If the response is 200_OK, then deletes the trip from firebase database also, and sets user's state to "available"
    const cancelTrip = () => {
        fetch(`${backendURL}/remove_trip`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({})
        }).then(response => response.json().then(data => ({status: response.status, data: data})))
        .then(res => {
            if (res.status === 200) {
                removeFirebaseTrip(trips.id, res.data.uids);
            }
            dispatch(updateStatus("available"));
        })
    }


    // Function for driver to end trip after completing trip.
    // sends request to backend /end_trip URL.
    // also deletes trip from firebase database.
    const endTrip = () => {
        fetch(`${backendURL}/end_trip`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({tripID: trips.id})
        }).then(response => response.json())
        .then(res => {
            if (!("errorType" in res)) {
                console.log("Driver ended trip");
                removeFirebaseTrip(trips.id, res.uids);
            }
            else {
                console.log(res.errorType, res.errorMessage);
            }
        })
    }

    return (
             <View style={{backgroundColor: "grey"}} width={widthPercentageToDP(100)}>
                <Box mb={1} width={widthPercentageToDP(100)}>
                    <Heading color="muted.100" marginX={0} padding={2}  size="lg" bg="muted.800">
                        Your Current Trip</Heading>
                    <Box bg="red" style={{elevation: 999}} marginX={3} mt={1} mb={2} width={widthPercentageToDP(80)}>
                        <HStack>
                            <Text color="white" bold fontSize="lg">From: {" "}</Text>
                            <Text color="white" fontSize="lg">{trips.locations.startingLocation.marker.description in dcuCampuses ? dcuCampuses[trips.locations.startingLocation.marker.description] : trips.locations.startingLocation.marker.description}</Text>
                        </HStack>
                        <HStack>
                            <Text color="white" bold fontSize="lg">To: {"      "}</Text>
                            <Text color="white" fontSize="lg">{trips.locations.destLocation.marker.description in dcuCampuses ? dcuCampuses[trips.locations.destLocation.marker.description] : trips.locations.destLocation.marker.description}</Text>
                        </HStack>
                    </Box>

                    <View style={{borderBottomColor: 'white', borderBottomWidth: 0.5}} width={widthPercentageToDP(100)}/>

                    <Box mt={2} bg="blue" marginX={3} mb={2}>
                        <HStack space={"30%"}>
                            <VStack>
                                <Text color="white">Departure Time:</Text>
                                <Text color="white" bold>{timedate(trips.timeOfDeparture)}</Text>
                            </VStack>
                            <VStack>
                                <Text color="white">Estimated Arrival Time:</Text>
                                <Text color="white" bold>{new Date(trips.ETA).toLocaleTimeString().slice(0, 5)}</Text>
                            </VStack>
                        </HStack>

                    </Box>

                    <View style={{borderBottomColor: 'white', borderBottomWidth: 0.5}}/>

                    <Box m={3}>
                        <TripPassengers passengers={trips.passengers} showPhoneNumbers={true}/>
                    </Box>
                    <Text marginX={3} color="white">{trips.availableSeats} Available seats</Text>
                </Box>
                <View style={{borderBottomColor: 'white', borderBottomWidth: 0.5}}/>

                 <Box marginX={3} marginY={2}>
                     <Text color="white">Total Distance:{"  "}{trips.distance}</Text>
                     <Text color="white">Total Duration:{"  "}{trips.duration}</Text>
                 </Box>

                 {/*  Hide/Show buttons if trip has departed */}
                 {isTripDeparted ?
                     <Button onPress={() => {endTrip()}}>
                         Trip Complete
                     </Button>
                     :
                     <>
                        <Button.Group mb={2} mx={{base:"auto", md:0}} alignSelf="center" size="lg">
                            <Button shadow={1} colorScheme="red" onPress={() => {setIsCancelTripPressed(true)}}>Cancel Trip</Button>

                            <Button shadow={1} onPress={() => {
                                update(ref(db, `/trips/${trips.id}`), {[`/status`]: "departed"})
                                get(ref(db, `/tripRequests/${trips.id}`)).then((snapshot) => {
                                if (snapshot.val() !== null) {
                                    let passengerKeys = Object.keys(snapshot.val());
                                    passengerKeys.map((key) => {
                                        update(ref(db, `/users/`), {[`/${key}`]: {tripRequested: {tripID: trips.id, requestStatus: "declined", status: ""}}});
                                    })
                                }
                                remove(ref(db, `/tripRequests/${trips.id}`));
                            })

                            }}>
                                Start Trip
                            </Button>
                        </Button.Group>
                    </>
                 }

                    {/* Shows "Are you sure?" modal, when driver presses cancel trip */}
                    {isCancelTripPressed &&
                        <TripAlertModal
                            headerText="Are you sure you want to Cancel Trip?"
                            bodyText="This action is irreversable."
                            btnAction={{
                                action: () => {
                                    cancelTrip()
                                },
                                text: "Yes"
                            }}
                            otherBtnAction={{
                                action: () => {
                                    setIsCancelTripPressed(false)
                                },
                                text: "No"
                            }}
                        />
                    }

             </View>
    )
}

export default DriverCurrentTrip;