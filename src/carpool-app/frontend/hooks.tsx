import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "./store";
import {getDatabase, ref, get, set, onValue, remove, update} from "firebase/database";


// redux typescript hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


// hooks

// used to create location objects when a user selects a location in AutoCompleteInput.
// also used to create location objects from the trip data (start, destination, waypoints) received from Django.
export const createLocationObj = (key: string, type: string, typeTitle: string, coords: { lat: number, lng: number } = {lat: 0, lng: 0}, name: any = false, isEntered: boolean = false) => {
    const id = type === "waypoint" ? key : type;

    return (
        {
             key: key,
             type: type,
             markerTitle: typeTitle,
             info: {
                coords: coords,
                isEntered: isEntered
             },
             marker: {
                        key: id,
                        coordinate: {
                            latitude: coords.lat,
                            longitude: coords.lng,
                        },
                        title: typeTitle,
                        description: name !== false ? name : "",
                        identifier: id
                     }
        }
    )
}

// Used to format Date object into string
export const timedate = (date) => {
    let tempDate = new Date(date);
    let day = "";
    let currentDate = new Date()
    let tomorrow = new Date()
    tomorrow.setDate(currentDate.getDate() + 1) 
    
    if (tempDate.getDate() === currentDate.getDate()) {
        day = "Today"
    } 
    if (tomorrow.getDate() === tempDate.getDate()) {
        day = "Tomorrow"
    }
    if (day !== "Today" && day !== "Tomorrow") {
        day = tempDate.toLocaleDateString();
    }

    return `${day} ${new Date(tempDate).toLocaleTimeString().slice(0, 5)}` 
} 


// firebase

// creates trip in firebase database
// returns true if trip was added to Firebase, otherwise false.
export function createFirebaseTrip(status, availableSeats, tripID, driverID, driverName) {

    if (status === "available") {
        const db = getDatabase();
        const reference = ref(db, `trips/${tripID}`)
        set(reference, {
            status: "waiting",
            driverID: driverID,
            driverName: driverName,
            passengers: {},
            availableSeats: availableSeats
        })
        return true;
    }

    return false;
}

// deletes trip from Firebase database.
// also deletes any active requests related to that trip.
// Sets all users involved in the trip to "trip_complete" status.
export async function removeFirebaseTrip(tripID, uids) {

    const db = getDatabase();

    get(ref(db, `/tripRequests/${tripID}`)).then((snapshot) => {
        let tripRequestUIDs = [];
        if (snapshot.val() !== null) {
            tripRequestUIDs = Object.keys(snapshot.val())
            tripRequestUIDs.map((uid) => {
                update(ref(db, `/users/`), {[`/${uid}`]: {tripRequested: {tripID: tripID, requestStatus: "declined", status: ""}}});
            });      
        }

        if (uids !== null && uids !== undefined) {
            uids.map((uid) => {
                update(ref(db, `/users/`), {[`/${uid}`]: {tripRequested: {tripID: null, requestStatus: "", status: "trip_complete"}}});
            });
        }
        remove(ref(db, `/tripRequests/${tripID}`));
        remove(ref(db, `/trips/${tripID}`)); 
    })
}

// This hook is called when a passenger presses the request button on a trip
// Function takes in tripID and passenger data.
// creates trip request in Firebase database. Also sets user request status to "waiting" indicating they have an active request.
export async function storeTripRequest(tripID, passengerData) {
    const db = getDatabase();

    let status: boolean;

    return (
        get(ref(db, `/trips/${tripID}`)).then((snapshot) => {

            if (snapshot.val() !== null) {
                status = snapshot.val().status === "waiting" && snapshot.val().availableSeats !== 0;
                if (status) {
                    update(ref(db, `/tripRequests/${tripID}/`), {[`/${passengerData.passengerID}`]: {...passengerData}});
                    update(ref(db, `/users/`) , {[`/${passengerData.passengerID}`]: {tripRequested: {tripID: tripID, requestStatus: "waiting", status: ""}}});
                }
                return status;
            }
            else {
                status = false;
            }

            return status
         })
    )

}


// This hook is called after a driver accepts a passenger's trip request.
// Deletes the trip request and adds the passenger to trip in Firebase database.
// also sets passenger requestStatus to "accepted" in firebase.
export async function acceptTripRequest(tripID, availableSeats, passengerData) {
    const db = getDatabase();

    update(ref(db, `/trips/${tripID}/passengers/`), {[`/${passengerData.passengerID}`]: {passengerId: passengerData.passengerID}});
    update(ref(db, `/trips/${tripID}/`), {[`/status`]: "waiting"})
    update(ref(db, `/trips/${tripID}/`), {[`/availableSeats`]: availableSeats})
    remove(ref(db, `/tripRequests/${tripID}/${passengerData.passengerID}`));
    update(ref(db, `/users/`) , {[`/${passengerData.passengerID}`]: {tripRequested: {tripID: tripID, requestStatus: "accepted", status: "in_trip"}}})
}

// This hook is called when a driver presses decline on passenger's trip request.
// deletes the trip request from firebase database, and sets passenger requestStatus to "declined".
export function declineTripRequest(tripID, passengerID) {
    const db = getDatabase();

    remove(ref(db, `/tripRequests/${tripID}/${passengerID}`));
    update(ref(db, `/users/`), {[`/${passengerID}`]: {tripRequested: {tripID: tripID, requestStatus: "declined", status: ""}}});
}
