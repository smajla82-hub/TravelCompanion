import { useState } from "react";

import { Card, Heading, Stack, Button } from "../ui";
import { ItineraryDayAdditionalDetails } from
    "./ItineraryDayAdditionalDetails";
import { ItineraryItemModal } from
    "./ItineraryItemModal";

import type {
    ItineraryDay,
    ItineraryItem,
} from "../../types";
import type { ItineraryItemFields } from
    "./ItineraryItemForm";
import { TripService } from "../../services/TripService";

type ItineraryDayDetailProps = {
    day: ItineraryDay;
    tripId: string;
    onClose: () => void;
    onDayChanged: () => void;
};

export function ItineraryDayDetail({
    day,
    tripId,
    onClose,
    onDayChanged,
}: ItineraryDayDetailProps) {
    const [modalOpen, setModalOpen] =
        useState(false);

    const [editingItem, setEditingItem] =
        useState<ItineraryItem | undefined>();

    function handleSubmit(
        fields: ItineraryItemFields
    ) {
        if (editingItem) {
            TripService.updateItineraryItem(
                tripId,
                day.date,
                editingItem.id,
                fields
            );
        } else {
            TripService.addItineraryItem(
                tripId,
                day.date,
                {
                    ...fields,
                    date: day.date,
                }
            );
        }

        setModalOpen(false);
        setEditingItem(undefined);
        onDayChanged();
    }

    function handleEdit(item: ItineraryItem) {
        setEditingItem(item);
        setModalOpen(true);
    }

    function handleDelete(itemId: string) {
        if (!window.confirm("Delete this activity?")) {
            return;
        }

        TripService.deleteItineraryItem(
            tripId,
            day.date,
            itemId
        );

        onDayChanged();
    }

    function handleMove(
        itemIndex: number,
        direction: number
    ) {
        const newIndex = itemIndex + direction;

        if (
            newIndex < 0 ||
            newIndex >= day.items.length
        ) {
            return;
        }

        const orderedItems = [...day.items];
        const [item] = orderedItems.splice(itemIndex, 1);

        orderedItems.splice(newIndex, 0, item);

        TripService.reorderItineraryItems(
            tripId,
            day.date,
            orderedItems.map(item => item.id)
        );

        onDayChanged();
    }

    return (
        <Card>
            <Stack gap="md">

                <Heading level={2}>
                    {day.date}
                    {day.title
                        ? ` — ${day.title}`
                        : ""}
                </Heading>

                <Button
                    type="button"
                    onClick={() => {
                        setEditingItem(undefined);
                        setModalOpen(true);
                    }}
                >
                    Add Activity
                </Button>

                <p>
                    {day.items.length} activities
                </p>

                <Stack gap="md">
                    {day.items.map((item, index) => (
                        <div key={item.id}>

                            <strong>
                                {item.time
                                    ? `${item.time} — `
                                    : ""}
                                {item.title}
                            </strong>

                            {item.location && (
                                <div>
                                    {item.location}
                                </div>
                            )}

                            {item.goal && (
                                <div>
                                    Goal: {item.goal}
                                </div>
                            )}

                            {item.priority && (
                                <div>
                                    Priority: {item.priority}
                                </div>
                            )}

                            {item.parking && (
                                <div>
                                    Parking: {item.parking}
                                </div>
                            )}

                            {item.smartChip && (
                                <div>
                                    {item.mapLink ? (
                                        <a
                                            href={item.mapLink}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {item.smartChip}
                                        </a>
                                    ) : (
                                        item.smartChip
                                    )}
                                </div>
                            )}

                            {item.price !== undefined &&
                                item.price !== null && (
                                    <div>
                                        Price: {item.price}
                                    </div>
                                )}

                            {item.note && (
                                <div>
                                    Note: {item.note}
                                </div>
                            )}

                            <Stack gap="sm">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        handleEdit(item)
                                    }
                                >
                                    Edit
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() =>
                                        handleDelete(item.id)
                                    }
                                >
                                    Delete
                                </Button>

                                <Button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() =>
                                        handleMove(index, -1)
                                    }
                                >
                                    Move up
                                </Button>

                                <Button
                                    type="button"
                                    disabled={
                                        index ===
                                        day.items.length - 1
                                    }
                                    onClick={() =>
                                        handleMove(index, 1)
                                    }
                                >
                                    Move down
                                </Button>
                            </Stack>

                        </div>
                    ))}
                </Stack>

                <ItineraryDayAdditionalDetails
                    day={day}
                />

                <Button
                    type="button"
                    onClick={onClose}
                >
                    Back to Itinerary
                </Button>

                <ItineraryItemModal
                    open={modalOpen}
                    item={editingItem}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingItem(undefined);
                    }}
                    onSubmit={handleSubmit}
                />

            </Stack>
        </Card>
    );
}