import type { RecommendedVenue } from "../../types";
import {
    getVenuePriorityColorVar,
    normalizeVenuePriority,
} from "../../domain/venue/VenuePriorityRegistry";

type RecommendedVenueSummaryProps = {
    venue: RecommendedVenue;
};

/**
 * Read-only content for a single Recommended Venue: Priority (shown with
 * its semantic Main/Backup color), name and the rest of the venue's
 * details. Used both by the read-only `RecommendedVenueList` (meal lookup)
 * and by the editable venues list in `ItineraryDayAdditionalDetails`, so
 * both places always render identical venue content.
 */
export function RecommendedVenueSummary({
    venue,
}: RecommendedVenueSummaryProps) {
    const priorityColorVar = getVenuePriorityColorVar(venue.priority);

    return (
        <div className="recommended-venue-summary">
            {venue.priority && (
                <div>
                    <strong
                        style={{ color: `var(${priorityColorVar})` }}
                    >
                        {normalizeVenuePriority(venue.priority) ??
                            venue.priority}
                    </strong>
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
    );
}
