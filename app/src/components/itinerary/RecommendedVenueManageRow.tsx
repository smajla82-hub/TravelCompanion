import { Button } from "../ui";
import { RecommendedVenueSummary } from "./RecommendedVenueSummary";
import "./ItineraryRow.css";

import type { RecommendedVenue } from "../../types";

type RecommendedVenueManageRowProps = {
    venue: RecommendedVenue;
    editable?: boolean;
    onManage?: () => void;
};

/**
 * A single Recommended Venue row in the editable venues list: venue content
 * plus a "Manage" button placed below it, bottom-left aligned (matching
 * `ActivitySummary`'s Manage button placement), followed by the shared
 * light-gray itinerary separator that spans the complete row including the
 * button.
 */
export function RecommendedVenueManageRow({
    venue,
    editable = false,
    onManage = () => {},
}: RecommendedVenueManageRowProps) {
    return (
        <div className="itinerary-activity-row">
            <div className="itinerary-activity-content">
                <RecommendedVenueSummary venue={venue} />

                {editable && (
                    <Button type="button" compact onClick={onManage}>
                        Manage
                    </Button>
                )}
            </div>
            <div className="itinerary-activity-separator" />
        </div>
    );
}
