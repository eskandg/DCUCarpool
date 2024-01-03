import {Icon, Input} from "native-base";
import Ionicons from "@expo/vector-icons/Ionicons";
import {TouchableOpacity} from "react-native";
import {useState} from "react";

// Password component to show/hide password text in form
function Password({passwordRef, onChangeText}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            ref={passwordRef}
            onChangeText={(text: string) => {onChangeText(text)}}
            rightElement={
                <TouchableOpacity onPress={() => {setShowPassword(!showPassword)}}>
                    <Icon as={Ionicons} name={showPassword ? "eye-off-outline" : "eye-outline"} mr={2} color={"blueGray.300"}/>
                </TouchableOpacity>
            }
        />

    )
}

export default Password;