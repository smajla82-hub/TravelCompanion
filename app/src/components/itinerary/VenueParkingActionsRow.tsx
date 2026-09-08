import { Button } from "../ui";
import "./ItineraryDayAdditionalDetails.css";

import {
    MAX_VENUES_PER_DAY,
    MAX_PARKING_PER_DAY,
    canAddVenue,
    canAddParkingLocation,
} from "../../domain/itinerary/venueParkingLimits";

type VenueParkingActionsRowProps = {
    venueCount: number;
    parkingCount: number;
    onAddParking: () => void;
    onAddVenue: () => void;
};

/**
 * Final row for the "Recommended venues & parking" section: "Add Parking"
 * on the left, "Add Venue" on the right, both using the same green
 * subtle-success styling as the "Recommended venues & parking" toggle.
 * Preserves the existing disabled state once a day's per-type limit is
 * reached.
 */
export function VenueParkingActionsRow({
    venueCount,
    parkingCount,
    onAddParking,
    onAddVenue,
}: VenueParkingActionsRowProps) {
    const parkingAvailable = canAddParkingLocation(parkingCount);
    const venueAvailable = canAddVenue(venueCount);

    return (
        <div className="venue-parking-actions-row">
            <Button
                type="button"
                compact
                variant="subtle-success"
                disabled={!parkingAvailable}
                onClick={onAddParking}
            >
                {parkingAvailable
                    ? "Add Parking"
                    : `Limit reached (${MAX_PARKING_PER_DAY}/day)`}
            </Button>

            <Button
                type="button"
                compact
                variant="subtle-success"
                disabled={!venueAvailable}
                onClick={onAddVenue}
            >
                {venueAvailable
                    ? "Add Venue"
                    : `Limit reached (${MAX_VENUES_PER_DAY}/day)`}
            </Button>
        </div>
    );
}
