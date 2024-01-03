/**
* Used for storing user info
*/

import {createAction, createSlice} from "@reduxjs/toolkit";

const initialState = {
    id: "",
    username: "",
    firstName: "",
    lastName: "",
    description: "",
    token: "",
    status: "available",
    tripRequestStatus: "",
    tripStatus: "",
    dateCreated: "",
    phoneNumber: "",
}

export const updateUserState = createAction<object>("user/update_state");
export const updateUserDescription = createAction<string>("user/update_user_description");
export const updateToken = createAction<string>("user/update_token");
export const updateStatus = createAction<string>("user/update_status");
export const updateTripRequestStatus = createAction<string | undefined>("user/update_trip_request_status");
export const updateTripStatus = createAction<string | undefined>("user/update_trip_status");


export const UserSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        update_state(state, action) {
          return {...state, ...action.payload};
        },
        update_id(state, action) {
            state.id = action.payload;
        },
        update_username(state, action) {
            state.username = action.payload;
        },
        update_status(state, action) {
            state.status = action.payload;
        },
        update_user_description(state, action) {
            state.description = action.payload;
        },
        update_trip_request_status(state, action) {
            state.tripRequestStatus = action.payload;
        },
        update_token(state, action) {
            state.token = action.payload;
        },
        update_trip_status(state, action) {
            state.tripStatus = action.payload;
        }
    }
})

export default UserSlice.reducer;
