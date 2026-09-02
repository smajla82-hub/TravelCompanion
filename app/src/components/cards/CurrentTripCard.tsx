import { Card, Button, Stack } from "../ui";

import "./CurrentTripCard.css";

import type { Trip } from "../../types";

import { formatDate } from "../../utils/formatDate";

type CurrentTripCardProps = {
    trip: Trip;
    onContinue: () => void;
};

export function CurrentTripCard({
    trip,
    onContinue,
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
                    onClick={onContinue}
                >
                    Continue Trip
                </Button>
            </Stack>
        </Card>
    );
}