import {StyleSheet, TouchableOpacity, StatusBar} from "react-native";
import {Heading, HStack, Box, VStack, Divider, ScrollView} from "native-base";
import {updateUserDescription} from "../reducers/user-reducer";
import {updateRole} from "../reducers/trips-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";
import Ionicons from '@expo/vector-icons/Ionicons';
import {useState} from "react";
import Profile from "../components/user/Profile";
import {heightPercentageToDP, widthPercentageToDP} from "react-native-responsive-screen";

// Home Screen
function HomeScreen({ navigation }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const [profileData, setProfileData] = useState<object>({username: "", profile_description: "", first_name: ""});

    // makes request to backend /create_passenger URL to add passenger to Django database.
    const createPassenger = () => {
        fetch(`${backendURL}/create_passenger`, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
        }).then(response => response.json())
        .then((res) => {
        if (!("errorType" in res)) {
            console.log("New Passenger created.");
        }
        else {
            console.log("Passenger Already Exists");
        }
        }).catch((e) => {
            console.error(e);
        });
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]} keyboardShouldPersistTaps="always">

            {/* User profile at top of screen */}
            <Profile uid={user.id} mode="bar" showPhoneNumber={true}/>

            <VStack space={0} zIndex={-1}>

                <Heading color="muted.100" marginX={2} padding={3} marginTop={5} size="lg" bg="muted.800">
                    Ready to Carpool {user.firstName}?
                </Heading>

                <Box mt="2" bg="white" padding={5} width={"95%"} alignSelf="center" shadow={2}>

                    <HStack space={1} alignItems="center">

                        {/* Driver Button */}
                        <VStack width={"50%"}>
                            <Heading alignSelf="center" size="md" letterSpacing={widthPercentageToDP(0.3)}>Sharing a ride?</Heading>
                            <Divider mt="1"/>
                            <TouchableOpacity onPress={() => {
                                dispatch(updateRole("driver"));
                                navigation.navigate("Driver");
                            }}>

                                <Box bg="muted.800" mt="1" paddingY={200} alignItems="center">
                                    <Ionicons name="car-outline" size={80} color="white"/>
                                    <Heading style={{letterSpacing: widthPercentageToDP(0.5)}} color="white" textAlign="center">Driver</Heading>
                                </Box>
                            </TouchableOpacity>
                        </VStack>

                        {/* Passenger Button */}
                        <VStack width={"50%"}>
                            <Heading size="md" alignSelf="center" letterSpacing={widthPercentageToDP(0.1)}>Looking to ride?</Heading>
                            <Divider mt="1"/>
                            <TouchableOpacity onPress={() => {
                                createPassenger();
                                dispatch(updateRole("passenger"));
                                navigation.navigate("Passenger");
                            }}>

                                <Box bg="muted.700" mt="1" paddingY={200} alignItems="center">
                                     <Ionicons style={{textAlign: "center"}} name="body" size={80} color="white"/>
                                     <Heading style={{letterSpacing: 2.5}} color="white" textAlign="center">Passenger</Heading>
                               </Box>
                            </TouchableOpacity>
                        </VStack>
                    </HStack>
                </Box>
            </VStack>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexGrow: 1,
      height: heightPercentageToDP(100),
      width: widthPercentageToDP(100),
      marginTop: StatusBar.currentHeight
    }
  });

export default HomeScreen;