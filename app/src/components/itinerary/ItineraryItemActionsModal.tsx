import { Button, Modal, Stack } from "../ui";

import type { ItineraryItem } from "../../types";

type ItineraryItemActionsModalProps = {
    open: boolean;
    item?: ItineraryItem;
    index: number;
    itemCount: number;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
};

export function ItineraryItemActionsModal({
    open,
    item,
    index,
    itemCount,
    onClose,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
}: ItineraryItemActionsModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={item?.title ?? "Activity"}
        >
            <Stack gap="sm">

                <Button
                    type="button"
                    onClick={onEdit}
                >
                    Edit
                </Button>

                <Button
                    type="button"
                    onClick={onDelete}
                >
                    Delete
                </Button>

                <Button
                    type="button"
                    disabled={index === 0}
                    onClick={onMoveUp}
                >
                    Move up
                </Button>

                <Button
                    type="button"
                    disabled={index === itemCount - 1}
                    onClick={onMoveDown}
                >
                    Move down
                </Button>

            </Stack>
        </Modal>
    );
}
