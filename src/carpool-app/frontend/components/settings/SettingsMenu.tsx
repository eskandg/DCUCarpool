import {StyleSheet, TouchableOpacity, View} from "react-native";
import {ScrollView, Text} from "native-base";
import {useAppDispatch, useAppSelector} from "../../hooks";
import Profile from "../user/Profile";
import {updateUserState} from "../../reducers/user-reducer";
import {resetTripState} from "../../reducers/trips-reducer";
import {showNumberOfSeatsAndTimePicker, showWaypoints} from "../../reducers/collapsibles-reducer";

// SettingsMenu component
function SettingsMenu({ navigation }) {
    const dispatch = useAppDispatch();
    let backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);

    // logout function to log user out of their account.
    // sends request to backend /logout URL, and resets user redux data to log them out
    const logout = () => {
        fetch(`${backendURL}/logout`, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: null
        }).then(response => ({ status: response.status }))
          .then((data) => {
            if (data.status === 200 || data.status === 401) {
                // navigates back to Login screen once token is an empty string (see App.tsx)
                dispatch(updateUserState({username: "", token: "", status: "available", tripRequestStatus: "", tripStatus: ""}));
                dispatch(resetTripState());
                dispatch(showWaypoints(false));
                dispatch(showNumberOfSeatsAndTimePicker(false));
            }
          }).catch((e) => {
              console.error(e);
          });
    }

    return (
        <View style={styles.container}>
            <ScrollView keyboardShouldPersistTaps={"handled"}>

                {/* Profile component at top of screen */}
                <Profile uid={user.id} mode="bar" logoutBtn={false}/>

                <TouchableOpacity style={styles.settingsButton} onPress={() => {navigation.navigate("Account")}}>
                    <View>
                        <Text>Account Info</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={{...styles.settingsButton}} onPress={() => {logout()}}>
                    <View>
                        <Text>Logout</Text>
                    </View>

                </TouchableOpacity>

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  settingsButton: {
      width: '100%',
      height: 53,
      padding: 15,
      marginBottom: 3,
      borderBottomColor: "#e4e4eb",
      borderBottomWidth: 0.5
    }
});


export default SettingsMenu;