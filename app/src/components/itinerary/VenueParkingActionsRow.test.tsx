import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VenueParkingActionsRow } from "./VenueParkingActionsRow";
import {
    MAX_PARKING_PER_DAY,
    MAX_VENUES_PER_DAY,
} from "../../domain/itinerary/venueParkingLimits";

describe("VenueParkingActionsRow", () => {
    it("renders Add Parking before Add Venue in the same row, both green subtle-success", () => {
        const markup = renderToStaticMarkup(
            <VenueParkingActionsRow
                venueCount={0}
                parkingCount={0}
                onAddParking={() => {}}
                onAddVenue={() => {}}
            />
        );

        const parkingIndex = markup.indexOf("Add Parking");
        const venueIndex = markup.indexOf("Add Venue");

        expect(markup).toContain("venue-parking-actions-row");
        expect(parkingIndex).toBeGreaterThan(-1);
        expect(venueIndex).toBeGreaterThan(-1);
        expect(parkingIndex).toBeLessThan(venueIndex);

        const successCount = (
            markup.match(/tc-button--subtle-success/g) ?? []
        ).length;
        expect(successCount).toBe(2);
    });

    it("disables Add Parking once the per-day parking limit is reached", () => {
        const markup = renderToStaticMarkup(
            <VenueParkingActionsRow
                venueCount={0}
                parkingCount={MAX_PARKING_PER_DAY}
                onAddParking={() => {}}
                onAddVenue={() => {}}
            />
        );

        expect(markup).toContain(
            `Limit reached (${MAX_PARKING_PER_DAY}/day)`
        );
        expect(markup).toContain("disabled=\"\"");
    });

    it("disables Add Venue once the per-day venue limit is reached", () => {
        const markup = renderToStaticMarkup(
            <VenueParkingActionsRow
                venueCount={MAX_VENUES_PER_DAY}
                parkingCount={0}
                onAddParking={() => {}}
                onAddVenue={() => {}}
            />
        );

        expect(markup).toContain(
            `Limit reached (${MAX_VENUES_PER_DAY}/day)`
        );
    });
});
