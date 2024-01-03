import { LogBox } from "react-native";
import {initializeApp} from "firebase/app";
import {FIREBASE_API_KEY} from "@env";
import {Provider} from "react-redux";
import {store} from "./store";
import Index from "./index";

LogBox.ignoreLogs(["Setting a timer"]);

// Firebase setup
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "ca326-carpool-app-firebase.firebaseapp.com",
  databaseURL: "https://ca326-carpool-app-firebase-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ca326-carpool-app-firebase",
  storageBucket: "ca326-carpool-app-firebase.appspot.com",
  messagingSenderId: "487214279440",
  appId: "1:487214279440:web:540d41374b73b0b10c9395"
};


const app = initializeApp(firebaseConfig);

export default function App() {
  return (
    <Provider store={store}>
      <Index/>
    </Provider>
  );
}

