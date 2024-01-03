import {TouchableOpacity} from "react-native";
import {Avatar, Icon} from "native-base";
import Ionicons from "@expo/vector-icons/Ionicons";

// ProfileIcon component to show profile avatar and active symbol
function ProfileIcon({setShowUserModal, style = {}}) {
    return (
        <TouchableOpacity onPress={() => {setShowUserModal(true)}}>
            <Avatar bg="muted.800" size="md" style={style}>
                <Icon color="white" as={Ionicons} name="person-outline"/>
                <Avatar.Badge borderColor="muted.600" bg="green.300"/>
            </Avatar>
        </TouchableOpacity>
    )
}

export default ProfileIcon;