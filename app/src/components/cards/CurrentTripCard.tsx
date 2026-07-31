import { Card, Button, Stack } from "../ui";

import "./CurrentTripCard.css";

import type { Trip } from "../../types/Trip";

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
                    {trip.startDate} – {trip.endDate}
                </p>

                <p>
                    👥 {trip.travellers} travellers
                </p>

                <Button>
                    Continue Trip
                </Button>
            </Stack>
        </Card>
    );
}