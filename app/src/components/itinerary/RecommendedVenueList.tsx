import { Stack } from "../ui";

import type { RecommendedVenue } from "../../types";

type RecommendedVenueListProps = {
    venues: RecommendedVenue[];
};

export function RecommendedVenueList({
    venues,
}: RecommendedVenueListProps) {
    if (venues.length === 0) {
        return (
            <p>
                No recommended venues for this day.
            </p>
        );
    }

    return (
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

                    {venue.mealType && (
                        <div>
                            Meal type: {venue.mealType}
                        </div>
                    )}

                    {venue.subtype && (
                        <div>
                            Subtype: {venue.subtype}
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
    );
}
