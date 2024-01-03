import {Button, Modal, Text, HStack} from "native-base";

// Component to create an alert modal by sending in props.
function TripAlertModal({headerText, bodyText, btnAction, otherBtnAction = false}) {

    return (
        <Modal isOpen={true}>
            <Modal.Content>
                <Modal.Header>
                    {headerText}
                </Modal.Header>
                <Modal.Body>
                    <Text>{bodyText}</Text>
                </Modal.Body>
                <Modal.Footer>
                    <HStack space={2}>
                        <Button minWidth="20%" onPress={() => {btnAction.action();}}>{btnAction.text}</Button>
                        {otherBtnAction &&
                            <Button minWidth="20%" onPress={() => {otherBtnAction.action();}}>{otherBtnAction.text}</Button>                        
                        }
                    </HStack>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    )
}

export default TripAlertModal;