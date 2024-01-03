import {useEffect, useState} from "react";
import {updateUserDescription} from "../../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../../hooks";
import ProfileIcon from "./ProfileIcon";
import ProfileModal from "./ProfileModal";
import ProfileBar from "./ProfileBar";

// Profile component to show profile icon and description
function Profile({uid, mode, logoutBtn = false,  showPhoneNumber = false, style = {}}) {
    const dispatch = useAppDispatch(); 
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);

    const [profileData, setProfileData] = useState<object>({username: "", profile_description: "", first_name: "", last_name: ""});
    const [showUserModal, setShowUserModal] = useState(false);
    const [editDescription, setEditDescription] = useState(false);
    const [userDescriptionText, setUserDescriptionText] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);

    // makes request to backend /get_profile url, to get a user's profile description
    const getProfile = (uid) => {
        fetch(`${backendURL}/get_profile`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({uid: uid})
        }).then(response => response.json().then(data => ({status: response.status, data: data})))
            .then((res) => {
                if (res.status === 200) {
                    if (user.id === uid) {
                        dispatch(updateUserDescription(res.data.profile_description));
                    }

                    setProfileData(res.data);
                }
            })
    }

    // makes request to backend /set_profile_description url, to set a user's profile description
    const setProfileDescription = (profileDescription) => {
        fetch(`${backendURL}/set_profile_description`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({profileDescription: profileDescription})
        })
        .then(response => {return {status: response.status}})
        .then((res) => {
            if (res.status === 200) {
                dispatch(updateUserDescription(profileDescription));
                setProfileData({...profileData, profile_description: profileDescription});
            }
        })
    }

    useEffect(() => {
        if (!isLoaded) {
            getProfile(uid);
            setIsLoaded(true);
        }
    }, [])

    return (
        <>
            {mode === "iconModal" &&
                <>
                    <ProfileIcon setShowUserModal={(value) => {setShowUserModal(value)}} style={style}/>
                    <ProfileModal
                        uid={uid}
                        showPhoneNumber={showPhoneNumber}
                        setShowUserModal={(value) => {setShowUserModal(value)}}
                        setEditDescription={(value) => {setEditDescription(value)}}
                        setProfileDescription={(value) => {setProfileDescription(value)}}
                        setUserDescriptionText={(value) => {setUserDescriptionText(value)}}
                        showUserModal={showUserModal}
                        editDescription={editDescription}
                        userDescriptionText={userDescriptionText}
                        profileData={profileData}
                    />
                </>
            }

            {mode === "bar" &&
                <>
                    <ProfileBar logoutBtn={logoutBtn} profileData={profileData} showUserModal={showUserModal} setShowUserModal={(value) => {setShowUserModal(value)}}/>
                    <ProfileModal
                        uid={uid}
                        showPhoneNumber={showPhoneNumber}
                        setShowUserModal={(value) => {setShowUserModal(value)}}
                        setEditDescription={(value) => {setEditDescription(value)}}
                        setProfileDescription={(value) => {setProfileDescription(value)}}
                        setUserDescriptionText={(value) => {setUserDescriptionText(value)}}
                        showUserModal={showUserModal}
                        editDescription={editDescription}
                        userDescriptionText={userDescriptionText}
                        profileData={profileData}
                    />
                </>

            }
        </>
    )
}

export default Profile;