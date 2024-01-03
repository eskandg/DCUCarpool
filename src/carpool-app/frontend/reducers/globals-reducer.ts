/**
* Used for storing general global info, such as the backend url
*/

import {createAction, createSlice} from "@reduxjs/toolkit";


const initialState = {
    backendURL: ""
}

export const updateGlobalsState = createAction<object>("globals/update_state");

export const GlobalsSlice = createSlice({
    name: "globals",
    initialState,
    reducers: {
        update_state(state, action) {
          return {...state, ...action.payload};
        }
    }
})

export default GlobalsSlice.reducer;