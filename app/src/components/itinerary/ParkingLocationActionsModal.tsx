import { Button, Modal, Stack } from "../ui";

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
                    <p>
                        {referencingItems.length} activit
                        {referencingItems.length === 1 ? "y" : "ies"}{" "}
                        reference{" "}
                        {referencingItems.length === 1 ? "s" : ""}{" "}
                        {parking?.code}: {" "}
                        {referencingItems
                            .map((item) => item.title)
                            .join(", ")}
                        . Remove or reassign them before deleting this
                        parking location.
                    </p>
                ) : (
                    <Button type="button" onClick={onDelete}>
                        Delete
                    </Button>
                )}
            </Stack>
        </Modal>
    );
}
