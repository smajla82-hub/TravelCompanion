import { Card, Stack } from "../ui";

import type { Trip } from "../../types/Trip";

import "./TripCard.css";

type TripCardProps = {
    trip: Trip;
};

export function TripCard({
    trip,
}: TripCardProps) {
    return (
        <Card>
            <Stack gap="sm">
                <h3>{trip.destination}</h3>

                <p>
                    {trip.startDate} – {trip.endDate}
                </p>

                <p>{trip.country}</p>
            </Stack>
        </Card>
    );
}