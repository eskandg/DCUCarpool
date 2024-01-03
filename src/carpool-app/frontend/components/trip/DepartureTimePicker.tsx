import TripAlertModal from "./TripAlertModal";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {setTimeOfDeparture} from "../../reducers/trips-reducer";
import {useEffect, useState} from "react";
import {useAppDispatch, useAppSelector, timedate} from "../../hooks";
import {Button, Text} from "native-base";

// Component to Select Departure Time for a trip.
function DepartureTimePicker() {
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const [dateToday, setDateToday] = useState(new Date());
    const [showTimeAlertModal, setShowTimeAlertModal] = useState(false);
    const [isTimeSelected, setIsTimeSelected] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

    // Gets updated current time every 5 minutes
    // used in DateTimePickerModal below to ensure time of departure is in the future
    useEffect(() => {
      const setTimeInterval = setInterval(() => {
          let date = new Date();
          date.setMinutes(date.getMinutes() + 5);
          setDateToday(date);
      }, 60000*5)

      return () => {
          clearInterval(setTimeInterval);
      }
    }, [])

    return (
        <>
              <Button pl={5} bg="muted.900" style={{alignItems: "flex-start", justifyContent: "flex-start"}} rounded={20} onPress={() => {
                  setTimePickerVisibility(true);
                  let date = new Date();
                  date.setMinutes(date.getMinutes() + 5);
                  setDateToday(date)
              }}>
                  <Text textAlign="left" color="white" fontSize={15}>
                    Time of Departure:{"   "}
                    <Text fontWeight="bold">
                        {!isTimeSelected ? "Now" : timedate(trips.timeOfDeparture)}
                    </Text>
                  </Text>
              </Button>

              {/* displays error modal if time selected is in the past. */}
              {showTimeAlertModal &&
                  <TripAlertModal
                      headerText={"Time Selection Error"}
                      bodyText={`Please enter a time in the future.\nPress OK to continue.`}
                      btnAction={
                          {
                              action: () => {
                                  setShowTimeAlertModal(false);
                                  setTimePickerVisibility(true);
                              },
                              text: "OK"
                          }
                      }
                  />
              }
              {/* imported DateTimePickerModal, when a user selects a time, checks if time is in the past.
                    If time is in the future, sets departure time.
               */}
              <DateTimePickerModal
                  mode="datetime"
                  date={dateToday}
                  is24Hour={false}
                  minimumDate={dateToday}
                  maximumDate={new Date(dateToday.getFullYear(), dateToday.getMonth(), dateToday.getDate()+7)}
                  minuteInterval={5}
                  isVisible={isTimePickerVisible}
                  onConfirm={(time) => {
                      console.log("Time selected:", time.toString());
                      let msecSelected = Date.parse(time.toString())
                      let msecNow = Date.parse(new Date().toString())

                      if ((msecSelected - msecNow) >= 0) {
                          dispatch(setTimeOfDeparture(time.toString()));
                          setTimePickerVisibility(false);
                          setIsTimeSelected(true);
                      }
                      else {
                          setTimePickerVisibility(false);
                          setShowTimeAlertModal(true)
                      }
                  }}
                  onCancel={() => {
                      setTimePickerVisibility(false);
                  }}/>
        </>
    )
}

export default DepartureTimePicker;