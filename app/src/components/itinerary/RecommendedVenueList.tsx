import { Stack } from "../ui";
import { RecommendedVenueSummary } from "./RecommendedVenueSummary";
import "./ItineraryRow.css";

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
                <div
                    key={venue.id}
                    className="itinerary-activity-row"
                >
                    <div className="itinerary-activity-content">
                        <RecommendedVenueSummary venue={venue} />
                    </div>
                    <div className="itinerary-activity-separator" />
                </div>
            ))}
        </Stack>
    );
}
