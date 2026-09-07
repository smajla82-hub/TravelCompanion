import { Modal } from "../ui";
import {
    ParkingLocationForm,
    type ParkingLocationFields,
} from "./ParkingLocationForm";

import type { ParkingLocation } from "../../types";

type ParkingLocationModalProps = {
    open: boolean;
    parking?: ParkingLocation;
    existingCodes: readonly string[];
    onClose: () => void;
    onSubmit: (parking: ParkingLocationFields) => void;
};

export function ParkingLocationModal({
    open,
    parking,
    existingCodes,
    onClose,
    onSubmit,
}: ParkingLocationModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={parking ? "Edit Parking" : "Add Parking"}
        >
            <ParkingLocationForm
                parking={parking}
                existingCodes={existingCodes}
                onSubmit={onSubmit}
            />
        </Modal>
    );
}
