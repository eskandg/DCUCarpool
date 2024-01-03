import {Button, Divider, Heading, HStack, Icon, VStack} from "native-base";
import Ionicons from "@expo/vector-icons/Ionicons";
import Collapsible from "react-native-collapsible";
import NumberOfSeatsSelector from "./NumberOfSeatsSelector";
import DepartureTimePicker from "./DepartureTimePicker";
import {useAppDispatch, useAppSelector} from "../../hooks";
import {showNumberOfSeatsAndTimePicker} from "../../reducers/collapsibles-reducer";

// Component for the Collapsible with departure time and seats selector.
function NumOfSeatsAndDepartureTimeCollapsible() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);
    const showDepartureAndTimePickerCollapsible = useAppSelector(state => state.collapsibles.showNumberOfSeatsAndTimePicker);
    const showWaypointsCollapsible = useAppSelector(state => state.collapsibles.showWaypoints);

    return (
        (!showWaypointsCollapsible && !user.tripRequestStatus && !user.tripStatus && user.status !== "driver_busy" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered ?
                <>
                    <Button
                        style={{backgroundColor: "white"}}
                        onPress={() => {
                            dispatch(showNumberOfSeatsAndTimePicker(!showDepartureAndTimePickerCollapsible))
                        }}
                    >
                        <HStack space={3} alignItems="center">
                            <Heading size={"sm"}>
                                Departure time {trips.role === "driver" && "and number of seats"}
                            </Heading>
                            <Icon as={Ionicons} name={showDepartureAndTimePickerCollapsible ? "chevron-down" : "chevron-up"}/>
                        </HStack>
                    </Button>

                    <Collapsible collapsed={!showDepartureAndTimePickerCollapsible}>
                        <VStack space={2} padding={5} borderTopWidth={0.5}>
                            <Heading size={"md"} flexGrow="1">Pick your departure time {trips.role === "driver" && "\nand number of seats"}</Heading>
                            <Divider/>

                            <NumberOfSeatsSelector/>
                            <DepartureTimePicker/>
                        </VStack>
                    </Collapsible>
                </>
        : null)
    )
}

export default NumOfSeatsAndDepartureTimeCollapsible;