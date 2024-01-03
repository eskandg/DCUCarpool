import TripScreen from "./TripScreen"
import {SafeAreaView} from "react-native";
import {useEffect, useState} from "react";
import {useAppDispatch, useAppSelector} from "../hooks";
import {resetTripState} from "../reducers/trips-reducer"

// Passenger Screen
function PassengerScreen({navigation}) {
    const dispatch = useAppDispatch();
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);

    // resets passenger's trip once their status is set to "available".
    // used for resetting trip when switching between passenger and driver screens.
    useEffect(() => {
        if (user.status === "available") {
            dispatch(resetTripState());
        }
    }, [trips.role])



    return (
        <SafeAreaView style={{flex: 1}}>

            {/* Trip Screen component */}
            <TripScreen/>

        </SafeAreaView>
    )
}

export default PassengerScreen;