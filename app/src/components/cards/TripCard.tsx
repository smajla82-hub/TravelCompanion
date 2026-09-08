import { Card, Stack } from "../ui";

import type { Trip } from "../../types/Trip";

import "./TripCard.css";

import { formatDate } from "../../utils/formatDate";
import { getCountryDisplayName, getCountryFlag } from "../../utils/country";

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
        <Card
            className="trip-card"
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={event => {
                if (onClick && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onClick();
                }
            }}
        >
            <Stack gap="sm">
                <div className="trip-card__header">
                    <h3>{getCountryFlag(trip.country)} {trip.destination}</h3>
                    <span className={`trip-source-status trip-source-status--${badge.toLowerCase()}`}>
                        <span aria-hidden="true" />{badge}
                    </span>
                </div>

                <p>
                    {formatDate(trip.startDate)} –{" "}
                    {formatDate(trip.endDate)}
                </p>

                <p>{getCountryDisplayName(trip.country)}</p>
            </Stack>
        </Card>
    );
}