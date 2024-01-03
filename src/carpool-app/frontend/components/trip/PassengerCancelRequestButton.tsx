import {Box, Button, Heading, Text, Modal, Spinner, Center} from "native-base";
import {getDatabase, ref, remove, update} from "firebase/database";
import {updateUserState} from "../../reducers/user-reducer";
import {updateTripState} from "../../reducers/trips-reducer";
import {useAppDispatch, useAppSelector} from "../../hooks";
import {View} from "react-native";

// Component for passenger cancel request button
function PassengerCancelRequestButton({setPreviousTripID}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);

    return (
        (trips.role === "passenger" && user.tripRequestStatus === "waiting" ?
          <View>
            <Box padding="5" bg="gray.700" rounded="lg" width="150%" alignSelf="center">

                <Heading color="white" size="md" alignSelf="center" mt="3" mb="1.5">Request Sent to "{trips.driverName}"</Heading>
                <Heading color="white" size="md" alignSelf="center" paddingTop="1.5" borderTopColor="white" borderTopWidth="0.5">Awaiting Response from Driver</Heading>
                <Spinner padding="3" size="lg"/>

                {/* cancel trip request button.
                deletes request from firebase database and resets passengers trip state */}
                <Button
                        mt="2"
                        colorScheme="red"
                        onPress={() => {
                            remove(ref(db, `/tripRequests/${trips.id}/${user.id}`));
                            update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: null}})
                            dispatch(updateUserState({tripRequestStatus: "", status: "available"}));
                            setPreviousTripID(trips.id);
                            dispatch(updateTripState({id: null}))
                        }}
                >
                    Cancel Request
                </Button>
            </Box>
          </View>
        : null)
    )
}

export default PassengerCancelRequestButton;