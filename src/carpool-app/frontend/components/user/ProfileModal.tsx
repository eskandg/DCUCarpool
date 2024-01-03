import {Avatar, Box, Divider, Heading, HStack, Icon, Modal, Text, TextArea, VStack} from "native-base";
import Ionicons from "@expo/vector-icons/Ionicons";
import {TouchableOpacity, TouchableWithoutFeedback, View} from "react-native";
import {useAppSelector} from "../../hooks";

// ProfileModal component to show a modal of any given users profile.
// uid is sent as a prop indicating which users profile to get.
function ProfileModal({uid, showPhoneNumber, showUserModal, setShowUserModal, setUserDescriptionText, editDescription, setEditDescription, profileData, setProfileDescription, userDescriptionText}) {
    const user = useAppSelector(state => state.user);

    return (
            <Modal isOpen={showUserModal} scrollEnabled={false} keyboardShouldPersistTaps="always" onClose={() => {setUserDescriptionText(""); setEditDescription(false); setShowUserModal(false)}}>
                <Modal.Content marginY={"auto"}>
                    <Modal.Header bg="muted.900" alignItems="center">
                        <Avatar bg="muted.800" size="xl" alignItems="center" alignSelf="center">
                            <Icon size={50} color="white" as={Ionicons} name="person-outline"/>
                            <Avatar.Badge style={{width: 25, height: 25}} borderColor="muted.600" bg="green.300"/>
                        </Avatar>

                        <Modal.CloseButton/>
                    </Modal.Header>
                    <Modal.Body bg={"white"}>

                            <Heading size={"md"}>{uid === user.id ? "Your Profile" : `${profileData.first_name}'s Profile`}</Heading>

                            <Divider my="4" shadow={1}/>

                            {showPhoneNumber &&
                                <>
                                    <Heading size={"md"}>Phone Number</Heading>
                                    <Text>{profileData.phone_number}</Text>
                                </>
                            }

                            <HStack mt={2} space={2} alignItems="center">
                                <Heading size={"md"} mb={2}>Description</Heading>
                                {(uid === user.id && editDescription) &&
                                    <>
                                        <TouchableOpacity>
                                            <Icon as={Ionicons} name={"save"} size={5} mb={2} color={"blueGray.500"} onPress={() => {setProfileDescription(userDescriptionText); setEditDescription(false);}}/>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{flexDirection: "row", marginLeft: "auto"}} onPress={() => {setEditDescription(false)}}>
                                            <Icon as={Ionicons} name={"close"} size={6} mb={2}/>
                                        </TouchableOpacity>
                                    </>
                                }
                            </HStack>
                            <Box borderBottomWidth={1} shadow={0.5}>
                                <HStack mb={1} alignItems="center">
                                    {(uid !== user.id || !editDescription) ?
                                        <>
                                            <TouchableWithoutFeedback onPress={() => {setEditDescription(true)}}>
                                                <Text width={"80%"}>
                                                    {profileData.profile_description !== "" ? profileData.profile_description : (user.id === uid ? "Tell us about yourself..." : "N/A")}
                                                </Text>
                                            </TouchableWithoutFeedback>

                                            {uid === user.id &&
                                                <TouchableOpacity onPress={() => {setEditDescription(true);}} style={{marginTop: "auto", marginLeft: "auto"}}>
                                                    <Icon color="muted.500" size={6} as={Ionicons} name="create-outline"/>
                                                </TouchableOpacity>
                                            }
                                        </>
                                        :
                                        <>
                                            <VStack mt={2} width={"100%"}>
                                                <View>
                                                    <TextArea maxLength={1000} onChangeText={(text) => {console.log(text); setUserDescriptionText(text)}} placeholder={profileData.profile_description !== "" ? profileData.profile_description : "Tell us about yourself..."}/>
                                                </View>
                                            </VStack>
                                        </>
                                    }
                                </HStack>
                            </Box>

                    </Modal.Body>

                </Modal.Content>
            </Modal>
    )
}

export default ProfileModal;