import { Modal } from "../ui";

type NewTripModalProps = {
    open: boolean;
    onClose: () => void;
};

export function NewTripModal({
    open,
    onClose,
}: NewTripModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="New Trip"
        >
            <p>
                Trip form will be here.
            </p>
        </Modal>
    );
}