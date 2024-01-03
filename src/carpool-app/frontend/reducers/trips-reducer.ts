/**
* Used for storing users current trip info/setup
*/

import {createAction, createSlice} from "@reduxjs/toolkit";
import { createLocationObj } from "../hooks";
import {act} from "react-dom/test-utils";

const locations = {
    startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: 53.1424, lng: -7.6921}),
    destLocation: createLocationObj("destLocation", "destination", "Destination Point"),
    waypoint1: createLocationObj("waypoint1", "waypoint", "Driver Stop"),
    waypoint2: createLocationObj("waypoint2", "waypoint", "Driver Stop"),
    waypoint3: createLocationObj("waypoint3", "waypoint", "Driver Stop"),
    waypoint4: createLocationObj("waypoint4", "waypoint", "Driver Stop"),
}

const initialState = {
    role: "",
    driverName: "",
    driverID: 0,
    locations: locations,
    markerRefs: {},
    numberOfWaypoints: 0,
    passengers: {},
    distance: "",
    duration: "",
    timeOfDeparture: "",
    availableSeats: 1,
    route: {},
    ETA: "",
    driverPhone: "",
    car: {}
}


export const updateTripState = createAction<object>("trips/update_trip_state");
export const resetTripState = createAction("trips/reset_trip_state");
export const updateRole = createAction<string>("trips/update_role");
export const setNumberOfWaypoints = createAction<number>("trips/set_number_of_waypoints");
export const setLocations = createAction<object>("trips/set_locations");
export const addPassenger = createAction<object>("trips/add_passenger");
export const removePassenger = createAction<object>("trips/remove_passenger");
export const setDistance = createAction<string>("trips/set_distance");
export const setDuration = createAction<string>("trips/set_duration");
export const setTimeOfDeparture = createAction<string>("trips/set_time_of_departure");
export const setAvailableSeats = createAction<number>("trips/set_available_seats");

export const TripsSlice = createSlice({
    name: "trips",
    initialState,
    reducers: {
        update_trip_state(state, action) {
          return {...state, ...action.payload};
        },
        set_number_of_waypoints(state, action) {
            if (action.payload >= 0 && action.payload < 5) {
                state.numberOfWaypoints = action.payload;
            }
        },
        set_locations(state, action) {
             state.locations = {...state.locations, ...action.payload};
        },
        update_role(state, action) {
            state.role = action.payload;
        },
        reset_trip_state(state) {
            return {
                role: state.role,
                locations: locations,
                markerRefs: {},
                numberOfWaypoints: 0,
                passengers: {},
                distance: "",
                duration: "",
                timeOfDeparture: "",
                availableSeats: 1,
                route: {},
                ETA: ""
            };

        },
        add_passenger(state, action) {
            state.passengers = {...state.passengers, ...action.payload};
        },
        remove_passenger(state, action) {
            let temp = new Map(Object.entries(state.passengers));
            temp.delete(action.payload);
            state.passengers = Object.fromEntries(temp);
        },
        set_distance(state, action) {
            state.distance = action.payload;
        },
        set_duration(state, action) {
            state.duration = action.payload;
        },
        set_time_of_departure(state, action) {
            state.timeOfDeparture = action.payload;
        },
        set_available_seats(state, action) {
            state.availableSeats = action.payload;
        }
    }
})

export default TripsSlice.reducer;