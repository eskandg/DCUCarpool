import {useAppDispatch, useAppSelector} from "../../hooks";
import MapView, {Marker} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {setDistance, setDuration, updateTripState} from "../../reducers/trips-reducer";
import {Alert as SystemAlert} from "react-native";
import {useEffect, useRef, useState} from "react";
import {GOOGLE_API_KEY} from "@env";

// @ts-ignore
import getDirections from "react-native-google-maps-directions";
import MapMarkers from "./MapMarkers";
import {heightPercentageToDP, widthPercentageToDP} from "react-native-responsive-screen";

// Map component shows map with route and markers on Trip Screen
function Map() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user)
    const trips = useAppSelector(state => state.trips);
    const mapRef = useRef(null);
    const [isRouteTapped, setIsRouteTapped] = useState(false);

    // used to zoom out/in on Map to show all markers
    const onMapReadyHandler = () => {
        if (mapRef.current) {
            setTimeout(() => {
                let markers = Object.keys(trips.locations).map((key) => trips.locations[key]).map((obj) => obj.type === "waypoint" ? obj.key : obj.marker.key);
                if (trips.locations.startingLocation.info.isEntered || trips.locations.destLocation.info.isEntered) {
                    mapRef.current.fitToSuppliedMarkers(markers, {animated: true});
                }
            }, 500)
        }
    }

    // function creates an array of addresses from locations that have type of "waypoint"
    // this array is used in MapViewDirections to display waypoints on map.
    const getWaypointNames = () => {
        return (
            Object.keys(trips.locations).filter((key) => trips.locations[key].marker.description && trips.locations[key].type === "waypoint" && trips.locations[key].info.isEntered)
                                        .map((key) => trips.locations[key].marker.description)
        );
    }

    // converts the distance and duration values to strings and stores in redux
    const distanceDurationHandler = (data) => {
        dispatch(updateTripState({"initialDurationSeconds": data.duration * 60}))

          if (data.distance.toFixed(1) < 1) {
              dispatch(setDistance(`${1000 * (data.distance % 1)} m`));
          } else {
              dispatch(setDistance(`${parseFloat(data.distance).toFixed(1)} km`));
          }
          let hoursDecimal = (data.duration / 60);
          let hours = Math.floor(hoursDecimal);
          let minutes = 60 * (hoursDecimal % 1);

          if (data.duration.toFixed(0) < 60) {
              dispatch(setDuration(`${minutes.toFixed(0)} min`));
          } else if (data.duration.toFixed(0) % 60 === 0) {
              dispatch(setDuration(`${hours} hr`));
          } else {
              dispatch(setDuration(`${hours} hr ${minutes.toFixed(0)} min`));
          }
    }

    // Allows users to click on the route displayed on the map to get directions via the Google Maps app or default browser.
    // This will show them a system alert before opening Google Maps.
    // Sends trip data to Google Maps, so users can easily get directions.
    const onPressHandler = () => {
          if (trips.role === "driver") {
              setIsRouteTapped(true);
              SystemAlert.alert("Get Directions?", "Tapping yes will get directions from the Google Maps App, or through your default browser.",
                  [
                    {
                        text: "Yes",
                        onPress: () => {
                            let waypoints: { latitude: any; longitude: any; }[] = []
                            Object.keys(trips.locations).sort().map((locationKey) => {
                                if (trips.locations[locationKey].type === "waypoint" && trips.locations[locationKey].info.isEntered === true) {
                                    waypoints.push({latitude: trips.locations[locationKey].info.coords.lat, longitude: trips.locations[locationKey].info.coords.lng})
                                }
                            })


                            setIsRouteTapped(false);
                            const tripData = {
                                source: {
                                  latitude: trips.locations.startingLocation.info.coords.lat,
                                  longitude: trips.locations.startingLocation.info.coords.lng
                                },
                                destination: {
                                  latitude: trips.locations.destLocation.info.coords.lat,
                                  longitude: trips.locations.destLocation.info.coords.lng
                                },
                                params: [
                                    {
                                        key: "travelmode",
                                        value: "driving"
                                    }
                                ],
                                waypoints: waypoints
                            }

                            getDirections(tripData);
                        }
                    },
                    {
                        text: "No",
                        onPress: () => {
                            setIsRouteTapped(false);
                        }
                    }
                  ]
          )}
    }

    useEffect(() => {
        // prevent re-animating map unnecessarily
        if (!trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered) {
                onMapReadyHandler();
        }
    }, [trips.locations.startingLocation, trips.locations.destLocation])

    return (
          // Map
          <MapView
              ref={mapRef}
              style={{flex: 1, minHeight: heightPercentageToDP(0.5)}}
              region={{
                  latitude: trips.locations.startingLocation.info.coords.lat,
                  longitude: trips.locations.startingLocation.info.coords.lng,
                  latitudeDelta: trips.locations.startingLocation.info.isEntered ? 0.01 : 4.50,
                  longitudeDelta: trips.locations.startingLocation.info.isEntered ? 0.01 : 4.50,
              }}
              onMapReady={onMapReadyHandler}
              minZoomLevel={(!trips.locations.startingLocation.info.isEntered && !trips.locations.destLocation.info.isEntered) ? undefined : 3}
              maxZoomLevel={15}
          >

              {/* If start and destination are in trips, shows route between them on map */}
              {trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered && (
                  <MapViewDirections
                      origin={trips.locations.startingLocation.marker.description}
                      destination={trips.locations.destLocation.marker.description}
                      {...(trips.numberOfWaypoints > 0 ?
                      {
                          waypoints: getWaypointNames()
                      }
                          : undefined)
                      }
                      optimizeWaypoints={true}
                      onReady={data => {distanceDurationHandler(data); onMapReadyHandler()}}
                      apikey={GOOGLE_API_KEY}
                      strokeWidth={3}
                      strokeColor={isRouteTapped ? "red" : "black"}
                      tappable={true}
                      onPress={() => {onPressHandler()}}
                  />

              )}
              {/* MapMarkers component shows the markers for each location on the map, with location information  */}
              <MapMarkers/>
          </MapView>
    )
}

export default Map;
