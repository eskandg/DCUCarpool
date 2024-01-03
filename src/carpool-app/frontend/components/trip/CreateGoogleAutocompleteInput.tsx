import {setLocations, setNumberOfWaypoints} from "../../reducers/trips-reducer";
import {GooglePlacesAutocomplete, GooglePlacesAutocompleteRef} from "react-native-google-places-autocomplete";
import {useEffect, useRef, useState} from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import {Alert, TouchableOpacity, TouchableWithoutFeedback} from "react-native";
import {Button, Center, Text} from "native-base";
import { useAppDispatch, useAppSelector, createLocationObj } from "../../hooks";
import {GOOGLE_API_KEY} from "@env";
import {heightPercentageToDP} from "react-native-responsive-screen";

// Component for creating GoogleAutoCompleteInput bar for entering/selecting location.
const CreateGoogleAutocompleteInput = ({locationObjName, placeholder = "Enter a waypoint..."}) => {
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const markerRef = useRef<GooglePlacesAutocomplete>();
    const locationObj = trips.locations[locationObjName];


    useEffect(() => {
        markerRef.current?.setAddressText(locationObj.marker.description);
    }, [trips.numberOfWaypoints])

   // function to delete driver waypoint
    // rearranges the order of other waypoints
    const deleteWaypoint = (waypoint) => {
        let waypointNum = parseInt(waypoint.key.charAt(waypoint.key.length - 1));
        let tempLocations: any = new Map(Object.entries(trips.locations));
        tempLocations.delete("startingLocation");
        tempLocations.delete("destLocation");

        let tempObj;
        while (waypointNum !== trips.numberOfWaypoints) {
            // if a waypoint is deleted, rearranges the order of waypoints.
            tempObj = tempLocations.get(`waypoint${waypointNum + 1}`);
            tempLocations.set(`waypoint${waypointNum}`, {
                ...tempObj,
                key: `waypoint${waypointNum}`,
                markerTitle: `Waypoint ${waypointNum}`,
                marker: {
                    ...tempObj.marker,
                    key: `waypoint${waypointNum}`,
                    identifier: `waypoint${waypointNum}`,
                    title: `Waypoint ${waypointNum}`
                }
            });

            tempLocations.set(`waypoint${waypointNum + 1}`, {
                ...tempObj,
                marker: {
                    ...tempObj, description: ""
                }
            });

            waypointNum++;
        }

        tempObj = tempLocations.get(`waypoint${trips.numberOfWaypoints}`);
        tempLocations.set(`waypoint${trips.numberOfWaypoints}`, {
            ...tempObj,
            info: {
                coords: {lat: 0, lng: 0},
                isEntered: false
            },
            marker: {
                ...tempObj.marker,
                coordinate: {
                    latitude: 0,
                    longitude: 0
                },
                description: ""
            }
        })

        markerRef.current?.setAddressText("");
        dispatch(setLocations(Object.fromEntries(tempLocations)));
        dispatch(setNumberOfWaypoints(trips.numberOfWaypoints - 1));
    }

    // sets trip location in redux when a user clicks on a location name from autoCompleteInput
    const handlePlacesResp = (locationObj, data, details) => {
        const id = locationObj.type === "waypoint" ? locationObj.key : locationObj.type;

        dispatch(setLocations({
            [locationObj.key]: {
                ...locationObj,
                info: {
                    ...locationObj.info,
                    coords: {
                        lat: details.geometry.location.lat,
                        lng: details.geometry.location.lng
                    },
                    isEntered: true
                },
                marker: {
                            key: id,
                            coordinate: {
                                latitude: details.geometry.location.lat,
                                longitude: details.geometry.location.lng
                            },
                            title: locationObj.markerTitle,
                            description: data.description,
                            identifier: id,
                        }
        }}));
    }

    return (
        // imported GooglePlacesAutocomplete component
        <GooglePlacesAutocomplete
            key={locationObj.key}
            ref={markerRef}
            style={{maxHeight: heightPercentageToDP(20)}}
            placeholder={placeholder}
            listViewDisplayed={markerRef.current?.getAddressText() !== ""}
            renderRightButton={() =>
                <>
                    <TouchableOpacity
                        onPress={() => {
                            markerRef.current?.setAddressText("");
                        }}
                        style={{justifyContent:"center"}}
                    >
                        <Center>
                            <Ionicons style={{marginRight: 5}} color={markerRef.current?.getAddressText() !== "" ? "black" : "#c8c7cc"} name="close-circle-outline" size={25} />
                        </Center>
                    </TouchableOpacity>

                    {locationObj.type === "waypoint" &&
                        <TouchableOpacity
                            onPress={() => {
                                deleteWaypoint(locationObj)
                            }}
                            style={{justifyContent:"center"}}
                        >
                            <Center>
                                <Ionicons style={{marginRight: 5}} color="red" name="remove-circle" size={25} />
                            </Center>
                        </TouchableOpacity>
                    }
                </>
            }
            styles={{container: {flex: 0}, textInput: {fontSize: 20}, zIndex: 1, position: "absolute"}}
            query={{
                key: GOOGLE_API_KEY,
                language: "en",
                components: "country:ie"
            }}
            nearbyPlacesAPI="GooglePlacesSearch"
            returnKeyType="search"
            debounce={400}
            minLength={2}
            enablePoweredByContainer={false}
            onPress={(data, details = null) => {
                handlePlacesResp(locationObj, data, details)
            }}
            fetchDetails={true}
        />
    );
};

export default CreateGoogleAutocompleteInput;