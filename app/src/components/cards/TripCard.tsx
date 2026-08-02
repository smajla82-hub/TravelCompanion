import { Card, Stack } from "../ui";

import type { Trip } from "../../types/Trip";

import "./TripCard.css";

import { formatDate } from "../../utils/formatDate";

type TripCardProps = {
    trip: Trip;

    onClick?: () => void;
};

export function TripCard({
    trip,
    onClick,
}: TripCardProps) {
    return (
        <div onClick={onClick}>
            <Card>
                <Stack gap="sm">
                    <h3>{trip.destination}</h3>

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