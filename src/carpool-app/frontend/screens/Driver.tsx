import {Button, Center, VStack, Heading, Spinner, ScrollView} from "native-base";
import TripScreen from "./TripScreen"
import {SafeAreaView} from "react-native";
import {useRef, useEffect, useState} from "react";
import {useAppSelector, useAppDispatch} from "../hooks";
import {FormControl, Input} from "native-base";
import {updateRole, resetTripState} from "../reducers/trips-reducer";
import {heightPercentageToDP, widthPercentageToDP} from "react-native-responsive-screen";

// Driver Screen
function DriverScreen({navigation}) {
    const dispatch = useAppDispatch();
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);
    const [getDriverRequestFinished, setGetDriverRequestFinished] = useState(false);
    const [hasCreatedDriverRole, setHasCreatedDriverRole] = useState(false);

    const makeInput = useRef("");
    const modelInput = useRef("");
    const colourInput = useRef("");
    const licensePlateInput = useRef("");

    const [makeText, setMakeText] = useState("");
    const [modelText, setModelText] = useState("");
    const [colourText, setColourText] = useState("");
    const [licensePlateText, setLicensePlateText] = useState("");

    // Makes a request to backend /get_driver URL to check if the driver already exists in django database
    // If the driver does not exist yet, they are shown a form to input their car details.
    // If the driver already exists, they are shown the normal driver screen.
    useEffect(() => {
        if (user.status === "available") {
            dispatch(resetTripState());
        }
        fetch(`${backendURL}/get_driver`, {
          method: "GET",
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Token ${user.token}`
          },
        }).then(response => response.json())
        .then(async (res) => {
            if (res.driver_exists) {
                setHasCreatedDriverRole(true);
            }
            else {
                setHasCreatedDriverRole(false);
            }
            setGetDriverRequestFinished(true);
        }).catch((e) => {
            console.error(e)
        })
    }, [])

    // resets driver trip once their status is set to "available"
    // used when for resetting trip data when switching between passenger and driver screens
    useEffect(() => {
        if (user.status === "available") {
            dispatch(resetTripState());
        }
    }, [trips.role])

    // makes request to backend /create_driver url, with car details from form data
    // If driver was created successfully in Django database, it hides the form from user and displays normal driver screen.
    const createDriver = () => {
        fetch(`${backendURL}/create_driver`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({make: makeText, model: modelText, colour: colourText, license_plate: licensePlateText})
        }).then(response => response.json())
        .then((res) => {
        if (!("errorType" in res)) {
            makeInput.current.clear();
            modelInput.current.clear();
            colourInput.current.clear();
            licensePlateInput.current.clear();
            console.log("Car Details saved.");
            console.log("NEW DRIVER CREATED");

            setHasCreatedDriverRole(true);
            setGetDriverRequestFinished(true);
        }
        else {
            console.log("Error");
        }
        }).catch((e) => {
            console.error(e);
        });
    };

    return (
        <SafeAreaView style={{flex: 1, height: heightPercentageToDP(100), width: widthPercentageToDP(100)}}>
            {!getDriverRequestFinished &&
                <Center>
                    <Spinner size="lg" height="100%"/>
                </Center>
            }

            {/* Car details form, for new drivers  */}
            {getDriverRequestFinished && !hasCreatedDriverRole &&
                <ScrollView keyboardShouldPersistTaps={"handled"}>
                    <VStack space={"5"} margin="5" alignItems="center">
                        <Heading size="lg">Car Details</Heading>
                        <FormControl>
                            <FormControl.Label>Make</FormControl.Label>
                            <Input placeholder="Make" ref={makeInput} onChangeText={(text: string) => {
                                setMakeText(text);
                            }}/>
                        </FormControl>

                        <FormControl>
                            <FormControl.Label>Model</FormControl.Label>
                            <Input placeholder="Model" ref={modelInput} onChangeText={(text: string) => {
                                setModelText(text);
                            }}/>
                        </FormControl>

                        <FormControl>
                            <FormControl.Label>Colour</FormControl.Label>
                            <Input placeholder="Colour" ref={colourInput} onChangeText={(text: string) => {
                                setColourText(text);
                            }}/>
                        </FormControl>

                        <FormControl>
                            <FormControl.Label>License Plate</FormControl.Label>
                            <Input placeholder="License Plate" ref={licensePlateInput} onChangeText={(text: string) => {
                                setLicensePlateText(text);
                            }}/>
                        </FormControl>

                        <Button mt="5" width="100%" onPress={() => {createDriver()}}>
                            Submit Car Information
                        </Button>
                    </VStack>
                </ScrollView>
            }

            {/* Normal trip screen if driver exists in Django database */}
            {getDriverRequestFinished && hasCreatedDriverRole &&
                <TripScreen/>
            }

        </SafeAreaView>
    )
}

export default DriverScreen;