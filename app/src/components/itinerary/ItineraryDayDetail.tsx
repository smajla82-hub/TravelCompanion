import { useEffect, useState } from "react";

import { Card, Heading, Stack, Button, Modal } from "../ui";
import { ItineraryDayAdditionalDetails } from
    "./ItineraryDayAdditionalDetails";
import { ItineraryItemModal } from
    "./ItineraryItemModal";
import { ItineraryItemActionsModal } from
    "./ItineraryItemActionsModal";
import { RecommendedVenueList } from
    "./RecommendedVenueList";
import { DayStatsList } from
    "./DayStatsList";

import type {
    ItineraryDay,
    ItineraryItem,
} from "../../types";
import type { ItineraryItemFields } from
    "./ItineraryItemForm";
import { TripService } from "../../services/TripService";
import { getItineraryItemTimingStatuses } from
    "../../utils/getItineraryItemTiming";
import {
    getMealTypeForItem,
    matchesMealType,
} from "../../utils/getMealTypeForItem";

const NOW_REFRESH_INTERVAL_MS = 60000;

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

    const [actionsIndex, setActionsIndex] =
        useState<number | null>(null);

    const [statsOpen, setStatsOpen] =
        useState(false);

    const [foodItemId, setFoodItemId] =
        useState<string | null>(null);

    const [parkingItemId, setParkingItemId] =
        useState<string | null>(null);

    const [now, setNow] = useState(
        () => new Date()
    );

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(new Date());
        }, NOW_REFRESH_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const timingStatuses =
        getItineraryItemTimingStatuses(
            day,
            day.items,
            now
        );

    const parkingItem =
        parkingItemId
            ? day.items.find(
                  item => item.id === parkingItemId
              )
            : undefined;

    const parkingLocation =
        parkingItem?.parking
            ? day.parkingLocations?.find(
                  location =>
                      location.code === parkingItem.parking
              )
            : undefined;

    const foodItem =
        foodItemId
            ? day.items.find(
                  item => item.id === foodItemId
              )
            : undefined;

    const mealType =
        foodItem
            ? getMealTypeForItem(foodItem)
            : undefined;

    const venues = mealType
        ? (day.venues ?? []).filter(venue =>
              matchesMealType(
                  venue.mealType,
                  mealType
              )
          )
        : [];

    const foodVenues =
        venues.length > 0
            ? venues
            : day.venues ?? [];

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
                    className="tc-button tc-button--compact"
                    onClick={() => setStatsOpen(true)}
                >
                    Statistics
                </Button>

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
                                {timingStatuses[item.id] === "current" &&
                                    "Now — "}
                                {timingStatuses[item.id] === "next" &&
                                    "Next — "}
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
                                {item.priority === "FOOD" && (
                                    <Button
                                        type="button"
                                        className="tc-button tc-button--compact"
                                        onClick={() =>
                                            setFoodItemId(item.id)
                                        }
                                    >
                                        Food
                                    </Button>
                                )}

                                {item.parking && (
                                    <Button
                                        type="button"
                                        className="tc-button tc-button--compact"
                                        onClick={() =>
                                            setParkingItemId(item.id)
                                        }
                                    >
                                        Parking
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    className="tc-button tc-button--compact"
                                    onClick={() =>
                                        setActionsIndex(index)
                                    }
                                >
                                    Manage
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

                <ItineraryItemActionsModal
                    open={actionsIndex !== null}
                    item={
                        actionsIndex !== null
                            ? day.items[actionsIndex]
                            : undefined
                    }
                    index={actionsIndex ?? 0}
                    itemCount={day.items.length}
                    onClose={() =>
                        setActionsIndex(null)
                    }
                    onEdit={() => {
                        if (actionsIndex === null) {
                            return;
                        }

                        handleEdit(
                            day.items[actionsIndex]
                        );

                        setActionsIndex(null);
                    }}
                    onDelete={() => {
                        if (actionsIndex === null) {
                            return;
                        }

                        handleDelete(
                            day.items[actionsIndex].id
                        );

                        setActionsIndex(null);
                    }}
                    onMoveUp={() => {
                        if (actionsIndex === null) {
                            return;
                        }

                        handleMove(actionsIndex, -1);

                        setActionsIndex(null);
                    }}
                    onMoveDown={() => {
                        if (actionsIndex === null) {
                            return;
                        }

                        handleMove(actionsIndex, 1);

                        setActionsIndex(null);
                    }}
                />

                <ItineraryItemModal
                    open={modalOpen}
                    item={editingItem}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingItem(undefined);
                    }}
                    onSubmit={handleSubmit}
                />

                <Modal
                    open={statsOpen}
                    onClose={() => setStatsOpen(false)}
                    title="Statistics"
                >
                    <DayStatsList
                        stats={day.stats ?? []}
                    />
                </Modal>

                <Modal
                    open={foodItemId !== null}
                    onClose={() => setFoodItemId(null)}
                    title="Recommended venues"
                >
                    <RecommendedVenueList
                        venues={foodVenues}
                    />
                </Modal>

                <Modal
                    open={parkingItemId !== null}
                    onClose={() => setParkingItemId(null)}
                    title="Parking"
                >
                    {parkingLocation ? (
                        <div>
                            <strong>
                                {parkingLocation.code}:
                            </strong>
                            {" "}
                            {parkingLocation.mapLink ? (
                                <a
                                    href={parkingLocation.mapLink}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {parkingLocation.name}
                                </a>
                            ) : (
                                parkingLocation.name
                            )}
                        </div>
                    ) : (
                        parkingItem?.parking && (
                            <div>
                                <strong>
                                    {parkingItem.parking}
                                </strong>

                                {parkingItem.mapLink ? (
                                    <div>
                                        <a
                                            href={parkingItem.mapLink}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {parkingItem.smartChip ??
                                                "Open in Google Maps"}
                                        </a>
                                    </div>
                                ) : (
                                    parkingItem.smartChip && (
                                        <div>
                                            {parkingItem.smartChip}
                                        </div>
                                    )
                                )}
                            </div>
                        )
                    )}
                </Modal>

            </Stack>
        </Card>
    );
}