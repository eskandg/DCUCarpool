import {Button, Divider, HStack, Icon, Text, View} from "native-base";
import {StyleSheet, TouchableOpacity} from "react-native";
import {resetTripState, setLocations} from "../../reducers/trips-reducer";
import Ionicons from "@expo/vector-icons/Ionicons";
import {createLocationObj, useAppDispatch} from "../../hooks";

// Component for selecting campus buttons and To/From DCU buttons at top of Trip Screen
function CampusDirectionSelector({campusSelected, setCampusSelected, isTripToDCU, setIsTripToDCU}) {
    const dispatch = useAppDispatch();

    return (
        <View style={{borderBottomColor: "blue"}}>
           {isTripToDCU === undefined ?
                <Button.Group isAttached={false} alignSelf="center" alignItems="center" justifyContent="center">
                    <Button
                            width="30%"
                            colorScheme="gray"
                            {...(isTripToDCU ? {colorScheme: "red"} : {variant: "outline"})}
                            onPress = {() => {
                                setIsTripToDCU(true);
                            }}
                        >
                            To DCU
                        </Button>
                    <Button
                        width="30%"
                        colorScheme="gray"
                        {...(!isTripToDCU && isTripToDCU !== undefined ? {colorScheme: "red"} : {variant: "outline"})}
                        onPress={() => {
                            setIsTripToDCU(false);
                        }}
                    >
                            From DCU
                    </Button>
                </Button.Group>
                :
                <HStack>
                    <TouchableOpacity
                        onPress={() => {
                            setIsTripToDCU(undefined);
                            setCampusSelected("");
                            dispatch(resetTripState())
                        }}
                        style={{alignSelf: "center", padding: 0}}
                    >
                        <Icon ml="2" as={Ionicons} name="arrow-back-outline"/>
                    </TouchableOpacity>

                    <Button.Group isAttached={false} alignSelf="center" alignItems="center" justifyContent="center">
                        <Button
                            colorScheme={"gray"}
                            borderWidth={1}
                            rounded={30}
                            width="40%"
                            {...(campusSelected == "GLA" ? {colorScheme: "red"} : {variant: "outline"})}
                            onPress={() => {
                                setCampusSelected("GLA");
                                if (isTripToDCU) {
                                    dispatch(setLocations({destLocation: createLocationObj("destLocation", "destination", "Destination Point", {lat: 53.3863494, lng: -6.256591399999999}, "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9", true)}))
                                } else {
                                    dispatch(setLocations({startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: 53.3863494, lng: -6.256591399999999}, "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9", true)}))
                                }
                            }}
                        >
                            <Text fontWeight="bold" {...(campusSelected === "GLA" ? {color: "white"} : {color: "black"})}>
                                {isTripToDCU ? "To " : "From "}{"\n"}
                                Glasnevin
                            </Text>
                        </Button>

                        <Button
                            colorScheme={"gray"}
                            borderWidth={1}
                            rounded={30}
                            width="40%"
                            {...(campusSelected == "PAT" ? {colorScheme: "red"} : {variant: "outline"})}
                            onPress={() => {
                                setCampusSelected("PAT");
                                if (isTripToDCU) {
                                    dispatch(setLocations({destLocation: createLocationObj("destLocation", "destination", "Destination Point", {lat: 53.3701804, lng: -6.254689499999999}, "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland", true)}))
                                }
                                else {
                                    dispatch(setLocations({startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: 53.3701804, lng: -6.254689499999999}, "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland", true)}))
                                }
                            }}
                        >
                            <Text fontWeight="bold" {...(campusSelected === "PAT" ? {color: "white"} : {color: "black"})}>
                                {isTripToDCU ? "To " : "From "}{"\n"}
                                St. Patrick's
                            </Text>
                        </Button>
                    </Button.Group>
                </HStack>
            }
            <Divider mt="5"/>
        </View>
    )
}

const styles = StyleSheet.create({
})

export default CampusDirectionSelector;