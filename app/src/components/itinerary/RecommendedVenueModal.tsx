import { Modal } from "../ui";
import {
    RecommendedVenueForm,
    type RecommendedVenueFields,
} from "./RecommendedVenueForm";

import type { RecommendedVenue } from "../../types";

type RecommendedVenueModalProps = {
    open: boolean;
    venue?: RecommendedVenue;
    onClose: () => void;
    onSubmit: (venue: RecommendedVenueFields) => void;
};

export function RecommendedVenueModal({
    open,
    venue,
    onClose,
    onSubmit,
}: RecommendedVenueModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={venue ? "Edit Venue" : "Add Venue"}
        >
            <RecommendedVenueForm venue={venue} onSubmit={onSubmit} />
        </Modal>
    );
}
