import { Card, Button, Stack } from "../ui";

import "./CurrentTripCard.css";

import type { Trip } from "../../types";

import { formatDate } from "../../utils/formatDate";

type CurrentTripCardProps = {
    trip: Trip;
};

export function CurrentTripCard({
    trip,
}: CurrentTripCardProps) {
    return (
        <Card>
            <Stack gap="md">
                <div className="trip-header">
                    <h2>
                        🇮🇹 {trip.destination}
                    </h2>

                    <span className="trip-status">
                        Active Trip
                    </span>
                </div>

                <p>
                    {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </p>

                <p>
                    👥 {trip.travellers} travellers
                </p>

                <Button
                    onClick={() =>
                        document
                            .getElementById(
                                "itinerary-section"
                            )
                            ?.scrollIntoView({
                                behavior: "smooth",
                            })
                    }
                >
                    Continue Trip
                </Button>
            </Stack>
        </Card>
    );
}