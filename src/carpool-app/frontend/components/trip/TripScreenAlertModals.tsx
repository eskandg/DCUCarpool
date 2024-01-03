import TripAlertModal from "./TripAlertModal";
import {updateStatus, updateUserState} from "../../reducers/user-reducer";
import {getDatabase, ref, update} from "firebase/database";
import {useAppDispatch, useAppSelector} from "../../hooks";
import {resetTripState} from "../../reducers/trips-reducer";

// Component creates alerts to show to passengers when a driver accepts/declines their request.
// Also creates alert to show to both passengers and drivers when their trip has ended.
function TripScreenAlertModals({setIsResetAfterTripComplete, setHideMap}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);


    return (
        <>
            {/* If passenger request is accepted by driver, shows accepted alert to passenger*/}
            {trips.role === "passenger" && user.tripRequestStatus === "accepted" && user.tripStatus === "in_trip" &&
                <TripAlertModal
                    headerText="Trip Alert"
                    bodyText="Your trip request has been accepted"
                    btnAction={{
                        action: () => {
                            dispatch(updateUserState({tripRequestStatus: ""}));
                            update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: {tripID: trips.id, requestStatus: "", status: "in_trip"}}});
                            setHideMap(false);
                        },
                        text: "OK"
                    }}
                />
            }

            {/* If passenger request was declined by driver, shows declined alert */}
            {trips.role === "passenger" && user.tripRequestStatus === "declined" &&
              <>
                  <TripAlertModal
                      headerText="Trip Alert"
                      bodyText={`Your request has been declined by Driver.\nTry request a different trip.`}
                      btnAction={{
                          action: () => {
                            update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: null}});
                            dispatch(updateStatus("available"))
                          },
                          text: "OK"
                      }}
                  />
              </>
            }

            {/* When tripStatus is set to "trip_complete", shows alert saying trip has ended. */}
            {user.tripStatus == "trip_complete" &&
                <TripAlertModal
                  headerText="Trip Alert"
                  bodyText="Your previous trip has ended"
                  btnAction={{
                      action: () => {
                        dispatch(updateUserState({status: "available", tripStatus: ""}));
                        dispatch(resetTripState());
                        update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: null}});
                        setIsResetAfterTripComplete(false);
                      },
                      text: "OK"
                  }}
                />
            }

        </>
    )
}

export default TripScreenAlertModals;