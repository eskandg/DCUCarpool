import {setAvailableSeats} from "../../reducers/trips-reducer";
import Ionicons from "@expo/vector-icons/Ionicons";
import {Icon, Select} from "native-base";
import {v4} from "uuid";
import {useAppDispatch, useAppSelector} from "../../hooks";

// Component for driver to select the number of seats for their trip.
function NumberOfSeatsSelector({}) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);

    return (
        (trips.role === "driver" && user.status !== "driver_busy" ?
              <Select
                  bg="muted.900"
                  color="white"
                  dropdownIcon={<Icon as={Ionicons} name="chevron-down" size={5} color={"gray.400"} marginRight={3}/>}
                  placeholder="Choose your number of available seats"
                  placeholderTextColor="white"
                  fontSize={15}
                  onValueChange={value => {dispatch(setAvailableSeats(parseInt(value)))}}
                  borderRadius={50}
                  pl={5}
              >
                  {[...Array(5).keys()].splice(1)
                      .map((number) => {
                            return (<Select.Item key={v4()} label={`${number} seats`} value={`${number}`}/>);
                      })
                  }
              </Select>
        : null)
    )
}

export default NumberOfSeatsSelector;