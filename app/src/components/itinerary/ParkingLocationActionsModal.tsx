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
    /** Delete and clear the `parking` field of every referencing activity. */
    onDeleteAndClearReferences: () => void;
};

export function ParkingLocationActionsModal({
    open,
    parking,
    referencingItems,
    onClose,
    onEdit,
    onDelete,
    onDeleteAndClearReferences,
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
                    <Stack gap="sm">
                        <p>
                            {referencingItems.length} activit
                            {referencingItems.length === 1 ? "y" : "ies"}{" "}
                            reference{" "}
                            {referencingItems.length === 1 ? "s" : ""}{" "}
                            {parking?.code}: {" "}
                            {referencingItems
                                .map((item) => item.title)
                                .join(", ")}
                            . Remove or reassign them before deleting, or
                            delete and clear these references.
                        </p>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={onDeleteAndClearReferences}
                        >
                            Delete and clear references
                        </Button>
                    </Stack>
                ) : (
                    <Button type="button" onClick={onDelete}>
                        Delete
                    </Button>
                )}
            </Stack>
        </Modal>
    );
}
