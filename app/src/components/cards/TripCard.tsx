import { Card, Stack } from "../ui";

import type { Trip } from "../../types/Trip";

import "./TripCard.css";

import { formatDate } from "../../utils/formatDate";
import { getCountryFlag } from "../../utils/getCountryFlag";

type TripCardProps = {
    trip: Trip;
    badge?: string;

    onClick?: () => void;
};

export function TripCard({
    trip,
    badge = "Offline",
    onClick,
}: TripCardProps) {
    return (
        <div onClick={onClick}>
            <Card>
                <Stack gap="sm">
                    <h3>{getCountryFlag(trip.country)} {trip.destination}</h3>
                    <p aria-label={`Trip source: ${badge}`}>{badge}</p>

                    <p>
                        {formatDate(trip.startDate)} –{" "}
                        {formatDate(trip.endDate)}
                    </p>

                    <p>{trip.country}</p>
                </Stack>
            </Card>
        </div>
    );
}