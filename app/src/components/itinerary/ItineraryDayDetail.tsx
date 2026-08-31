import { Card, Heading, Stack, Button } from "../ui";

import type { ItineraryDay } from "../../types";

type ItineraryDayDetailProps = {
    day: ItineraryDay;
    onClose: () => void;
};

export function ItineraryDayDetail({
    day,
    onClose,
}: ItineraryDayDetailProps) {
    return (
        <Card>
            <Stack gap="md">

                <Heading level={2}>
                    {day.date}
                    {day.title
                        ? ` — ${day.title}`
                        : ""}
                </Heading>

                <p>
                    {day.items.length} activities
                </p>

                <Stack gap="md">
                    {day.items.map((item) => (
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
                                    {item.smartChip}
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

                        </div>
                    ))}
                </Stack>

                <Button
                    type="button"
                    onClick={onClose}
                >
                    Back to Itinerary
                </Button>

            </Stack>
        </Card>
    );
}