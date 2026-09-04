import { Modal } from "../ui";

import {
    ItineraryDayForm,
    type ItineraryDayFields,
} from "./ItineraryDayForm";

type ItineraryDayModalProps = {
    open: boolean;
    defaultDate: string;
    onClose: () => void;
    onSubmit: (day: ItineraryDayFields) => void;
};

export function ItineraryDayModal({
    open,
    defaultDate,
    onClose,
    onSubmit,
}: ItineraryDayModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add Day"
        >
            <ItineraryDayForm
                key={defaultDate}
                defaultDate={defaultDate}
                onSubmit={onSubmit}
            />
        </Modal>
    );
}
