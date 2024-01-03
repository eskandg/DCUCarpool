import {Marker} from "react-native-maps";
import {useAppSelector} from "../../hooks";

// Component creates markers for each location in trip.
function MapMarkers() {
    const trips = useAppSelector(state => state.trips);

    return (
        <>
            {trips.locations.startingLocation.info.isEntered && (
              <Marker {...trips.locations.startingLocation.marker}/>
            )}

            {trips.locations.destLocation.info.isEntered && (
              <Marker {...trips.locations.destLocation.marker}/>
            )}

            {trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered && (
              Object.keys(trips.locations).sort().map((key) => {
                  return (trips.locations[key].type === "waypoint" && trips.locations[key].info.isEntered) && <Marker key={`waypointLoc${key}`} {...trips.locations[key].marker}/>;
              }))
            }
        </>

    )
}

export default MapMarkers;