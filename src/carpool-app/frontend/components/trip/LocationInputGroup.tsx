import CreateGoogleAutocompleteInput from "./CreateGoogleAutocompleteInput";
import {v4} from "uuid";
import {useAppDispatch, useAppSelector} from "../../hooks";
import Collapsible from "react-native-collapsible";
import {useEffect} from "react";
import {Button, Divider, Heading, HStack, Icon, VStack, Text} from "native-base";
import Ionicons from "@expo/vector-icons/Ionicons";
import CampusDirectionSelector from "./CampusDirectionSelector";
import {showWaypoints} from "../../reducers/collapsibles-reducer";

// LocationInputGroup for showing To/From DCU buttons at top of Trip
// Shows campus selector after pressing either TO or FROM
// Shows GoogleAutoCompleteInput once user has selected a campus
function LocationInputGroup({isTripToDCU, setIsTripToDCU, campusSelected, setCampusSelected, increaseWaypoints}) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);
    const showWaypointCollapsible = useAppSelector(state => state.collapsibles.showWaypoints);
    const showNumOfSeatsAndTimeCollapsible = useAppSelector(state => state.collapsibles.showNumberOfSeatsAndTimePicker);

    useEffect(() => {
        dispatch(showWaypoints(false));
    }, [])

    return (
        <>

            {(!showWaypointCollapsible && (!trips.locations.startingLocation.info.isEntered || trips.locations.destLocation.info.isEntered) || (trips.locations.startingLocation.info.isEntered || !trips.locations.destLocation.info.isEntered) && !showWaypointCollapsible) &&
                <CampusDirectionSelector
                    campusSelected={campusSelected}
                    setCampusSelected={(value: string) => {setCampusSelected(value)}}
                    isTripToDCU={isTripToDCU}
                    setIsTripToDCU={(value: boolean | undefined) => {setIsTripToDCU(value)}}
                />
            }

            {(!showWaypointCollapsible || (trips.locations.startingLocation.info.isEntered || trips.locations.destLocation.info.isEntered)) ?
                isTripToDCU ?
                    ((!showWaypointCollapsible && trips.locations.destLocation.info.isEntered) ?
                    <CreateGoogleAutocompleteInput
                        locationObjName={"startingLocation"}
                        placeholder="Enter your starting point..."
                        style={{rounded: 5}}
                    />
                    : null)
                    :
                    ((!showWaypointCollapsible && trips.locations.startingLocation.info.isEntered) ?
                    <CreateGoogleAutocompleteInput
                        locationObjName={"destLocation"}
                        placeholder="Enter your destination..."
                    />
                    : null)
                : null
            }

            {(trips.role === "driver" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered) &&
                <>
                    <Button
                        style={{backgroundColor: "white"}}
                        onPress={() => {
                            dispatch(showWaypoints(!showWaypointCollapsible));
                        }}
                    >
                        <HStack space={3} alignItems="center">
                            <Heading size={"sm"}>
                                Waypoints
                            </Heading>
                            <Icon as={Ionicons} name={showWaypointCollapsible ? "chevron-up" : "chevron-down"}/>
                        </HStack>
                    </Button>

                    <Collapsible collapsed={!showWaypointCollapsible}>
                        <VStack space={2} paddingX={5} paddingBottom={5} borderTopWidth={0.2}>
                            <Divider/>

                            {user.status === "available" &&
                              <>
                                     {Object.keys(trips.locations).sort().map((key) => {
                                          if (trips.locations[key].type === "waypoint") {
                                              if (parseInt(key.charAt(key.length - 1)) <= trips.numberOfWaypoints) {
                                                  return (
                                                      <CreateGoogleAutocompleteInput
                                                          key={v4()}
                                                          locationObjName={key}
                                                      />
                                                  );
                                              }
                                          }
                                    })}

                                    {trips.role === "driver" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered &&
                                      <Button pl={5} mt={2} bg="muted.900" style={{alignItems: "flex-start", justifyContent: "flex-start"}} rounded={20} onPress={() => {
                                        increaseWaypoints();
                                      }}>
                                          <HStack alignItems="center" space={2}>
                                              <Icon as={Ionicons} name="add" color="white"/>
                                              <Text color="white" fontWeight="bold">Add waypoint</Text>
                                          </HStack>
                                      </Button>
                                    }
                             </>
                            }
                        </VStack>
                    </Collapsible>

                </>


                }
        </>
    )
}

export default LocationInputGroup;