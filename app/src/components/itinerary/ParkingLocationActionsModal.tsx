import { Button, Modal, Stack } from "../ui";
import "./ParkingLocationActionsModal.css";

import type { ItineraryItem, ParkingLocation } from "../../types";

type ParkingLocationActionsModalProps = {
    open: boolean;
    parking?: ParkingLocation;
    /** Activities in the same day currently referencing this parking code. */
    referencingItems: ItineraryItem[];
    onClose: () => void;
    onEdit: () => void;
    /** Delete only when nothing references this parking location. */
    onDelete: () => void;
};

export function ParkingLocationActionsModal({
    open,
    parking,
    referencingItems,
    onClose,
    onEdit,
    onDelete,
}: ParkingLocationActionsModalProps) {
    const isReferenced = referencingItems.length > 0;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={parking?.code ?? "Parking"}
        >
            <Stack gap="sm">
                <Button type="button" onClick={onEdit}>
                    Edit
                </Button>

                {isReferenced ? (
                    <div className="parking-actions-warning">
                        <p className="parking-actions-warning__heading">
                            {referencingItems.length}{" "}
                            {referencingItems.length === 1
                                ? "Activity"
                                : "Activities"}{" "}
                            reference
                            {referencingItems.length === 1 ? "s" : ""}{" "}
                            {parking?.code}:
                        </p>

                        <ul className="parking-actions-warning__list">
                            {referencingItems.map((item) => (
                                <li key={item.id}>
                                    {item.title},
                                </li>
                            ))}
                        </ul>

                        <p className="parking-actions-warning__note">
                            Remove or reassign them before deleting this
                            parking location.
                        </p>
                    </div>
                ) : (
                    <Button type="button" onClick={onDelete}>
                        Delete
                    </Button>
                )}
            </Stack>
        </Modal>
    );
}
