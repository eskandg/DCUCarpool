// index.tsx file: stores backend server URL, and manages Navigation tabs to each screen.

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { NativeBaseProvider, Box} from 'native-base';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import SettingsScreen from "./screens/Settings";
import {useState, useEffect, useMemo, useCallback} from "react";
import Ionicons from '@expo/vector-icons/Ionicons'
import {updateGlobalsState} from "./reducers/globals-reducer";
import {createLocationObj, useAppDispatch, useAppSelector} from "./hooks";
import {updateRole, setLocations} from "./reducers/trips-reducer";
import PassengerScreen from "./screens/Passenger";
import DriverScreen from "./screens/Driver";
import TripAlertModal from "./components/trip/TripAlertModal";
import {showNumberOfSeatsAndTimePicker, showWaypoints} from "./reducers/collapsibles-reducer";

const Tab = createBottomTabNavigator();

export default function Index() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const trips = useAppSelector(state => state.trips);
  const [hideAuthTabs, setHideAuthTabs] = useState(false);
  const [tabAlert, setTabAlert] = useState(false);
  const [showStatusAvailableFromDriverAlert, setShowStatusAvailableFromDriverAlert] = useState(false);
  const [showStatusAvailableFromPassengerAlert, setShowStatusAvailableFromPassengerAlert] = useState(false);
  const [showStatusPassengerBusyAlert, setShowStatusPassengerBusyAlert] = useState(false);
  const [showStatusDriverBusyAlert, setShowStatusDriverBusyAlert] = useState(false);

  // stores backend URL where server is running on Heroku
  useEffect(() => {
      dispatch(updateGlobalsState({backendURL: "http://blooming-shelf-28383.herokuapp.com"}));
  }, [])

  // shows only login/register tabs if user is not logged in.
  // if user is logged in, hides login/register tabs and shows main tabs. (home, driver, passenger, settings)
  useEffect(() => {
    if (user.token !== "") {
      setHideAuthTabs(true);
    }
    else {
      setHideAuthTabs(false);
    }
  }, [user.token])

  const navigationRef = createNavigationContainerRef();

  return (
    <NativeBaseProvider>
      <NavigationContainer ref={navigationRef}>

        {showStatusAvailableFromPassengerAlert &&
          <TripAlertModal
            headerText={"Setup Warning"}
            bodyText={"Changes may be lost when switching screen between Passenger and Driver."}
            btnAction={{action: () => {setShowStatusAvailableFromPassengerAlert(false); dispatch(updateRole("driver")); navigationRef.navigate("Driver")}, text: "YES"}}
            otherBtnAction={{action: () => {setShowStatusAvailableFromPassengerAlert(false);}, text: "NO"}}
          />
        }

        {showStatusAvailableFromDriverAlert &&
          <TripAlertModal
            headerText={"Setup Warning"}
            bodyText={"Changes may be lost when switching screen between Driver and Passenger."}
            btnAction={{action: () => {setShowStatusAvailableFromDriverAlert(false); dispatch(updateRole("passenger")); navigationRef.navigate("Passenger");}, text: "YES"}}
            otherBtnAction={{action: () => {setShowStatusAvailableFromDriverAlert(false);}, text: "NO"}}
          />
        }

        {showStatusPassengerBusyAlert &&
          <TripAlertModal
            headerText={"Trip Warning"}
            bodyText={"You have an ongoing trip as a Passenger. Please wait for the driver to complete it or wait an hour for the estimated time of arrival of the trip before accessing the Driver screen."}
            btnAction={{action: () => {setShowStatusDriverBusyAlert(false)}, text: "OK"}}
          />
        }

        {showStatusDriverBusyAlert &&
          <TripAlertModal
            headerText={"Trip Warning"}
            bodyText={"You have an ongoing trip as a Driver. Please complete or cancel it before accessing the Passenger screen."}
            btnAction={{action: () => {setShowStatusDriverBusyAlert(false)}, text: "OK"}}
          />
        }

        <Tab.Navigator>
          {hideAuthTabs ?
              <>
                {user.status === "available" &&
                    <Tab.Screen name="Home" component={HomeScreen}
                        options={
                          {tabBarIcon: () => {return <Ionicons name="home" size={25} color={"grey"}/>;}, headerShown: false}
                        }
                        listeners={({navigation, route}) => ({
                            tabPress: (e) => {
                              e.preventDefault();
                              let routeName = navigationRef.current?.getCurrentRoute().name;
                              if (routeName === "Driver") {
                                dispatch(updateRole("driver"))
                                dispatch(showWaypoints(false));
                                dispatch(showNumberOfSeatsAndTimePicker(false));
                              }
                              navigation.navigate("Home")
                            }
                        })}
                    />
                }

                {(user.status === "available" || user.status === "passenger_busy") &&
                  <Tab.Screen name="Passenger" component={PassengerScreen}
                    options={
                      {tabBarIcon: () => {return <Ionicons name="body" size={25} color="grey"/>;}}
                    }
                    listeners={ ({navigation, route }) => ({
                      tabPress: (e) => {
                        e.preventDefault();

                        let routeName = navigationRef.current?.getCurrentRoute().name;
                        let routeCondition = routeName === "Driver";

                        if (user.status === "available") {
                          if (routeCondition) {
                              setTabAlert(true)

                              // warn that changes may be lost
                              setShowStatusAvailableFromDriverAlert(true);
                          }
                          else {
                            if (trips.role === "") {
                              dispatch(updateRole("passenger"));
                            }
                            navigation.navigate("Passenger")
                          }
                        }

                        if (user.status === "driver_busy") {
                          setTabAlert(true)
                          navigation.navigate("Driver")

                          // alert you have an ongoing trip as driver
                          setShowStatusDriverBusyAlert(true);
                        }
                        else if (user.status === "passenger_busy") {
                          dispatch(updateRole("passenger"));
                          navigation.navigate("Passenger")
                        }
                      }
                    })}
                  />

                }

                {(user.status === "available" || user.status === "driver_busy") &&
                  <Tab.Screen name="Driver" component={DriverScreen}
                    options={
                        {tabBarIcon: () => {return <Ionicons name="car-outline" size={25} color="grey"/>}}
                    }
                    listeners={({navigation, route}) => ({
                      tabPress: (e) => {
                        e.preventDefault();
                        let routeName = navigationRef.current?.getCurrentRoute().name;
                        let routeCondition = routeName === "Passenger";

                        if (user.status === "available") {
                          if (routeCondition) {
                              setTabAlert(true)

                              // warn that changes may be lost
                              setShowStatusAvailableFromPassengerAlert(true);
                          }
                          else {
                            if (trips.role === "") {
                              dispatch(updateRole("passenger"));
                            }
                            navigation.navigate("Passenger")
                          }
                        }

                        if (routeName === "Passenger") {
                          if (user.status === "available") {
                              setTabAlert(true)
                              // warn that changes may be lost
                              setShowStatusAvailableFromPassengerAlert(true);
                          }

                          if (user.status === "passenger_busy") {
                            if (routeName !== "Passenger") {
                              setTabAlert(true)

                              // alert you have an ongoing trip as driver
                              setShowStatusPassengerBusyAlert(true);
                              navigation.navigate("Passenger")
                            }
                          }
                        }
                        else {
                           navigation.navigate("Driver")
                        }
                      }
                    })}
                  />
                }


                <Tab.Screen name="Settings" component={SettingsScreen}
                  options={
                    {headerShown: false, tabBarIcon: () => {return <Ionicons name="settings-outline" size={25} color={"grey"}/>;}}
                  }
                  listeners={({navigation, route}) => ({
                      tabPress: (e) => {
                        e.preventDefault();
                        let routeName = navigationRef.current?.getCurrentRoute().name;
                        if (routeName === "Driver") {
                          dispatch(updateRole("driver"))
                          dispatch(showWaypoints(false));
                          dispatch(showNumberOfSeatsAndTimePicker(false));
                        }
                        navigation.navigate("Settings")

                      }
                  })}
                />
              </>
              :
              <>
                <Tab.Screen name="Login" component={LoginScreen}
                  options={
                    {tabBarIcon: () => {return <Ionicons name="log-in-outline" size={25} color={"grey"}/>;}}
                  }
                />
                <Tab.Screen name="Register" component={RegisterScreen}
                  options={
                    {tabBarIcon: () => {return <Ionicons name="duplicate-outline" size={25} color={"grey"}/>;}}
                  }
                />
              </>
          }

        </Tab.Navigator>
      </NavigationContainer>
    </NativeBaseProvider>
  );
}
