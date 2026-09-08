import { Button } from "../ui";
import { ParkingLocationSummary } from "./ParkingLocationSummary";
import "./ItineraryRow.css";

import type { ParkingLocation } from "../../types";

type ParkingLocationManageRowProps = {
    parking: ParkingLocation;
    editable?: boolean;
    onManage?: () => void;
};

/**
 * A single Parking Location row in the editable parking list: parking
 * content plus a "Manage" button placed below it, bottom-left aligned
 * (matching `ActivitySummary`'s and `RecommendedVenueManageRow`'s Manage
 * button placement), followed by the shared light-gray itinerary
 * separator that spans the complete row including the button.
 */
export function ParkingLocationManageRow({
    parking,
    editable = false,
    onManage = () => {},
}: ParkingLocationManageRowProps) {
    return (
        <div className="itinerary-activity-row">
            <div className="itinerary-activity-content">
                <ParkingLocationSummary parking={parking} />

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
