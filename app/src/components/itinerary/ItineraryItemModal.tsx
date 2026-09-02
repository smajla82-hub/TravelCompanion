import { Modal } from "../ui";
import {
  ItineraryItemForm,
  type ItineraryItemFields,
} from "./ItineraryItemForm";

import type { ItineraryItem } from "../../types";

type ItineraryItemModalProps = {
  open: boolean;
  item?: ItineraryItem;
  onClose: () => void;
  onSubmit: (item: ItineraryItemFields) => void;
};

export function ItineraryItemModal({
  open,
  item,
  onClose,
  onSubmit,
}: ItineraryItemModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Activity" : "Add Activity"}
    >
      <ItineraryItemForm item={item} onSubmit={onSubmit} />
    </Modal>
  );
}
