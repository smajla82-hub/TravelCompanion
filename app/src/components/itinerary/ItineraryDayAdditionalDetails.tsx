import { useState } from "react";

import { Button, Card, Stack } from "../ui";

import type { ItineraryDay } from "../../types";

type ItineraryDayAdditionalDetailsProps = {
    day: ItineraryDay;
};

export function ItineraryDayAdditionalDetails({
    day,
}: ItineraryDayAdditionalDetailsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const venues = day.venues ?? [];
    const stats = day.stats ?? [];
    const parkingLocations =
        day.parkingLocations ?? [];

    if (
        venues.length === 0 &&
        stats.length === 0 &&
        parkingLocations.length === 0
    ) {
        return null;
    }

    return (
        <Stack gap="md">
            <Button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen
                    ? "Hide details"
                    : "Recommended venues, parking & statistics"}
            </Button>

            {isOpen && (
                <Card variant="outlined">
                    <Stack gap="md">
                        {venues.length > 0 && (
                            <div>
                                <strong>
                                    Recommended venues
                                </strong>

                                <Stack gap="sm">
                                    {venues.map((venue) => (
                                        <div key={venue.id}>
                                            <strong>
                                                {venue.name}
                                            </strong>

                                            {venue.type && (
                                                <div>
                                                    Type: {venue.type}
                                                </div>
                                            )}

                                            {venue.priority && (
                                                <div>
                                                    Priority: {venue.priority}
                                                </div>
                                            )}

                                            {venue.smartChip && (
                                                <div>
                                                    {venue.mapLink ? (
                                                        <a
                                                            href={venue.mapLink}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {venue.smartChip}
                                                        </a>
                                                    ) : (
                                                        venue.smartChip
                                                    )}
                                                </div>
                                            )}

                                            {venue.price && (
                                                <div>
                                                    Price: {venue.price}
                                                </div>
                                            )}

                                            {venue.reservation && (
                                                <div>
                                                    Reservation: {venue.reservation}
                                                </div>
                                            )}

                                            {venue.recommendation && (
                                                <div>
                                                    {venue.recommendation}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </Stack>
                            </div>
                        )}

                        {parkingLocations.length > 0 && (
                            <div>
                                <strong>
                                    Parking
                                </strong>

                                <Stack gap="sm">
                                    {parkingLocations.map(
                                        (parkingLocation) => (
                                            <div
                                                key={parkingLocation.code}
                                            >
                                                <strong>
                                                    {parkingLocation.code}:
                                                </strong>
                                                {" "}
                                                {parkingLocation.mapLink ? (
                                                    <a
                                                        href={
                                                            parkingLocation
                                                                .mapLink
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        {
                                                            parkingLocation
                                                                .name
                                                        }
                                                    </a>
                                                ) : (
                                                    parkingLocation.name
                                                )}
                                            </div>
                                        )
                                    )}
                                </Stack>
                            </div>
                        )}

                        {stats.length > 0 && (
                            <div>
                                <strong>
                                    Statistics
                                </strong>

                                <Stack gap="sm">
                                    {stats.map((stat) => (
                                        <div key={stat.label}>
                                            <strong>
                                                {stat.label}:
                                            </strong>
                                            {" "}
                                            {stat.value}
                                        </div>
                                    ))}
                                </Stack>
                            </div>
                        )}
                    </Stack>
                </Card>
            )}
        </Stack>
    );
}
