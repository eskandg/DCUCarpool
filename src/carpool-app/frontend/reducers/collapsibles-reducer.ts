/**
* Used for preventing multiple collapsibles being open for TripScreen.tsx
*/

import {createAction, createSlice} from "@reduxjs/toolkit";


const initialState = {
    showNumberOfSeatsAndTimePicker: false,
    showWaypoints: false
}

export const showNumberOfSeatsAndTimePicker = createAction<boolean>("collapsibles/show_number_of_seats_and_time_picker");
export const showWaypoints = createAction<boolean>("collapsibles/show_waypoints");

export const CollapsiblesSlice = createSlice({
    name: "collapsibles",
    initialState,
    reducers: {
        show_number_of_seats_and_time_picker(state, action) {
            state.showNumberOfSeatsAndTimePicker = action.payload;
        },
        show_waypoints(state, action) {
            state.showWaypoints = action.payload;
        }
    }
})

export default CollapsiblesSlice.reducer;