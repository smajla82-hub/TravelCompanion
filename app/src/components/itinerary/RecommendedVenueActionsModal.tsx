import { Button, Modal, Stack } from "../ui";

import type { RecommendedVenue } from "../../types";

type RecommendedVenueActionsModalProps = {
    open: boolean;
    venue?: RecommendedVenue;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
};

export function RecommendedVenueActionsModal({
    open,
    venue,
    onClose,
    onEdit,
    onDelete,
}: RecommendedVenueActionsModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={venue?.name ?? "Venue"}
        >
            <Stack gap="sm">
                <Button type="button" onClick={onEdit}>
                    Edit
                </Button>

                <Button type="button" onClick={onDelete}>
                    Delete
                </Button>
            </Stack>
        </Modal>
    );
}
