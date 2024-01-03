import {HStack, ScrollView, Text, VStack} from "native-base";
import Profile from "../user/Profile";
import {v4} from "uuid";

// Component to show all passengers currently in trip, in a horizontal scrollable container.
// Used in PassengerCurrentTrip and DriverCurrentTrip
function TripPassengers({passengers, showPhoneNumbers = false}) {
    return (
        <HStack color="white" alignItems="center" p={1}>
            <ScrollView horizontal={true} keyboardShouldPersistTaps="handled">

                <HStack>
                    {/* Loops over each passenger in passengers */}
                    {Object.keys(passengers).map((passengerKey, index) => {
                        return (
                            <>
                                <VStack key={v4()}>
                                    {/* Component shows profile of user whos uid is passed as prop */}
                                    <Profile uid={parseInt(passengerKey.slice("passenger".length))} mode="iconModal"
                                             showPhoneNumber={showPhoneNumbers}/>
                                    <Text color="white" bold>{passengers[passengerKey].passengerName}{"    "}</Text>
                                </VStack>
                            </>
                        )
                    })}
                </HStack>

            </ScrollView>

        </HStack>
    )
}

export default TripPassengers;