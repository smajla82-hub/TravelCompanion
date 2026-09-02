import { useEffect, useState } from "react";

import { Button, Card, Heading, Stack } from "../ui";

import type {
    ItineraryDay,
    ItineraryItem,
    Trip,
} from "../../types";
import { getItineraryItemTimingStatuses } from
    "../../utils/getItineraryItemTiming";
import "./CurrentActivityView.css";

type CurrentActivityViewProps = {
    trip: Trip;
    onViewWholeItinerary: () => void;
    onShowDay: (day: ItineraryDay) => void;
};

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function ActivitySummary({
    item,
    compact = false,
}: {
    item: ItineraryItem;
    compact?: boolean;
}) {
    return (
        <Card variant="outlined" className={`activity-summary${compact ? " activity-summary--compact" : ""}`}>
            <Stack gap="sm">
                <div className="activity-main">
                    {item.time && <span className="time-badge">{item.time}</span>}
                    <span className="activity-icon">✦</span>
                    <strong>{item.title}</strong>
                </div>

                {item.location && <div className="activity-detail">⌖ {item.location}</div>}

                {!compact && item.goal && (
                    <div className="activity-detail">◎ Goal: {item.goal}</div>
                )}

                {!compact && item.priority && (
                    <div className="activity-detail">ϟ Priority: {item.priority}</div>
                )}

                {!compact && item.parking && (
                    <div className="activity-detail">P Parking: {item.parking}</div>
                )}

                {!compact && item.smartChip && (
                    <div className="activity-detail">
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

                {!compact && item.price !== undefined && (
                    <div className="activity-detail">$ Price: {item.price}</div>
                )}

                {!compact && item.note && (
                    <div className="activity-detail">✎ Note: {item.note}</div>
                )}
            </Stack>
        </Card>
    );
}

export function CurrentActivityView({
    trip,
    onViewWholeItinerary,
    onShowDay,
}: CurrentActivityViewProps) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(new Date());
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const today = formatLocalDate(now);
    const startDate = trip.startDate.slice(0, 10);
    const endDate = trip.endDate.slice(0, 10);
    const itinerary = trip.itinerary ?? [];

    if (today < startDate) {
        const daysUntilStart = Math.ceil(
            (new Date(`${startDate}T00:00:00`).getTime() -
                new Date(`${today}T00:00:00`).getTime()) /
                86400000
        );

        return (
            <section>
                <Heading level={3}>
                    Trip starts in {daysUntilStart} days
                </Heading>
                <Button onClick={onViewWholeItinerary}>
                    View whole Itinerary
                </Button>
            </section>
        );
    }

    if (today > endDate) {
        return (
            <section>
                <Heading level={3}>Trip has ended</Heading>
                <Button onClick={onViewWholeItinerary}>
                    View whole Itinerary
                </Button>
            </section>
        );
    }

    const day = itinerary.find(item => item.date === today);

    if (!day) {
        return (
            <section>
                <p>Today&apos;s itinerary is not available.</p>
                <Button onClick={onViewWholeItinerary}>
                    View whole Itinerary
                </Button>
            </section>
        );
    }

    const statuses = getItineraryItemTimingStatuses(
        day,
        day.items,
        now
    );
    const currentItem = day.items.find(
        item => statuses[item.id] === "current"
    );
    const nextItem = day.items.find(
        item => statuses[item.id] === "next"
    );

    return (
        <section>
            <h3 className="activity-label">Current Activity</h3>
            {currentItem ? (
                <ActivitySummary item={currentItem} />
            ) : (
                <p>No current activity.</p>
            )}

            {nextItem && (
                <>
                    <h3 className="activity-label">Next Activity</h3>
                    <ActivitySummary
                        item={nextItem}
                        compact
                    />
                </>
            )}

            <Button
                type="button"
                onClick={() => onShowDay(day)}
            >
                ••• Show more
            </Button>

            <Button
                type="button"
                onClick={onViewWholeItinerary}
            >
                View whole Itinerary
            </Button>
        </section>
    );
}
