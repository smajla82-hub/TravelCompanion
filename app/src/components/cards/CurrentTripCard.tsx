import { Card, Button, Stack } from "../ui";

import "./CurrentTripCard.css";

import type { Trip } from "../../types";

import { formatDate } from "../../utils/formatDate";
import { getCountryFlag } from "../../utils/getCountryFlag";

type CurrentTripCardProps = {
    trip: Trip;
    onContinue: () => void;
};

export function CurrentTripCard({
    trip,
    onContinue,
}: CurrentTripCardProps) {
    return (
        <Card className="current-trip-card">
            <Stack gap="md">
                <div className="trip-header">
                    <h2 title={trip.destination}>
                        {getCountryFlag(trip.country)} {trip.destination}
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
                    variant="outline"
                    onClick={onContinue}
                >
                    Continue Trip
                </Button>
            </Stack>
        </Card>
    );
}