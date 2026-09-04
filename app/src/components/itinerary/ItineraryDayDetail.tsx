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
import { ActivityActionStack } from
    "./ActivityActionStack";
import { ActivitySummary } from
    "./ActivitySummary";
import "./ItineraryDayDetail.css";

import type {
    ItineraryDay,
    ItineraryItem,
} from "../../types";
import type { ItineraryItemFields } from
    "./ItineraryItemForm";
import { TripService } from "../../services/TripService";
import {
    getMealTypeForItem,
    matchesMealType,
} from "../../utils/getMealTypeForItem";
import { getRemainingItineraryItems } from
    "../../utils/getItineraryItemTiming";

type ItineraryDayDetailProps = {
    day: ItineraryDay;
    tripId: string;
    onClose: () => void;
    onDayChanged: () => void;
    /**
     * When true, restricts the day to its "remaining" activities: the
     * current one plus any upcoming/future ones (activities with a
     * missing/invalid time are always kept). Reserved for the active
     * trip's active day entered via Current Activity's "Show more".
     * "View whole itinerary" always opens with this left `false` so the
     * complete, unfiltered history remains available there.
     */
    showRemainingOnly?: boolean;
};

export function ItineraryDayDetail({
    day,
    tripId,
    onClose,
    onDayChanged,
    showRemainingOnly = false,
}: ItineraryDayDetailProps) {
    const [modalOpen, setModalOpen] =
        useState(false);

    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!showRemainingOnly) {
            return;
        }

        const intervalId = setInterval(() => {
            setNow(new Date());
        }, 60000);

        return () => clearInterval(intervalId);
    }, [showRemainingOnly]);

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

    const matchingVenues =
        mealType
            ? (day.venues ?? []).filter(venue =>
                  matchesMealType(
                      venue.mealType,
                      mealType
                  )
              )
            : undefined;

    // When the activity's meal type can be determined, only that
    // meal's venues are relevant, even if none were found in the
    // RoadBook data (e.g. a hotel breakfast with no external venue).
    // Only fall back to the day's full venue list when the meal type
    // itself could not be determined at all.
    const foodVenues =
        matchingVenues ??
        day.venues ??
        [];

    const foodEmptyMessage =
        mealType
            ? "No recommended venues for this meal."
            : "No recommended venues for this day.";

    const visibleItems = showRemainingOnly
        ? getRemainingItineraryItems(day, day.items, now)
        : day.items;

    const visibleItemIds = showRemainingOnly
        ? new Set(visibleItems.map(item => item.id))
        : null;

    const allActivitiesFinished =
        showRemainingOnly &&
        day.items.length > 0 &&
        visibleItems.length === 0;

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
                    {visibleItems.length} activities
                </p>

                {allActivitiesFinished ? (
                    <p className="itinerary-day-detail-empty-state">
                        All activities for today are finished.
                    </p>
                ) : (
                    <Stack gap="md">
                        {day.items.map((item, index) => {
                            if (
                                visibleItemIds &&
                                !visibleItemIds.has(item.id)
                            ) {
                                return null;
                            }

                            return (
                                <div className="itinerary-activity-row" key={item.id}>
                                    <div className="itinerary-activity-content">
                                        <ActivitySummary item={item} />

                                        <Button
                                            type="button"
                                            compact
                                            onClick={() =>
                                                setActionsIndex(index)
                                            }
                                        >
                                            Manage
                                        </Button>
                                    </div>
                                    <ActivityActionStack
                                        showFood={item.priority === "FOOD"}
                                        showParking={Boolean(item.parking)}
                                        onFood={() => setFoodItemId(item.id)}
                                        onParking={() => setParkingItemId(item.id)}
                                        onStatistics={() => setStatsOpen(true)}
                                    />
                                    <div className="itinerary-activity-separator" />
                                </div>
                            );
                        })}
                    </Stack>
                )}

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
                        emptyMessage={foodEmptyMessage}
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
