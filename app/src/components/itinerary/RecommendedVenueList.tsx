import { Stack } from "../ui";

import type { RecommendedVenue } from "../../types";

type RecommendedVenueListProps = {
    venues: RecommendedVenue[];
    emptyMessage?: string;
};

export function RecommendedVenueList({
    venues,
    emptyMessage = "No recommended venues for this day.",
}: RecommendedVenueListProps) {
    if (venues.length === 0) {
        return (
            <p>
                {emptyMessage}
            </p>
        );
    }

    return (
        <Stack gap="sm">
            {venues.map((venue) => (
                <div key={venue.id}>

                    {venue.priority && (
                        <div>
                            {venue.priority}
                        </div>
                    )}

                    <strong>
                        {venue.name}
                    </strong>

                    {venue.subtype && (
                        <div>
                            {venue.subtype}
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
                            Price/person: {venue.price}
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
