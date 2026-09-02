import { useState } from "react";

import { Button, Card, Stack } from "../ui";
import { RecommendedVenueList } from "./RecommendedVenueList";

import type { ItineraryDay } from "../../types";

type ItineraryDayAdditionalDetailsProps = {
    day: ItineraryDay;
};

export function ItineraryDayAdditionalDetails({
    day,
}: ItineraryDayAdditionalDetailsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const venues = day.venues ?? [];
    const parkingLocations =
        day.parkingLocations ?? [];

    if (
        venues.length === 0 &&
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
                    : "Recommended venues & parking"}
            </Button>

            {isOpen && (
                <Card variant="outlined">
                    <Stack gap="md">
                        {venues.length > 0 && (
                            <div>
                                <strong>
                                    Recommended venues
                                </strong>

                                <RecommendedVenueList
                                    venues={venues}
                                />
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
                    </Stack>
                </Card>
            )}
        </Stack>
    );
}
