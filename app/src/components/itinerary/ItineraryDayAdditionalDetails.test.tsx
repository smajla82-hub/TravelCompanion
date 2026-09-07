import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ItineraryDayAdditionalDetails } from "./ItineraryDayAdditionalDetails";

import type { ItineraryDay } from "../../types";

function baseDay(overrides: Partial<ItineraryDay> = {}): ItineraryDay {
    return {
        id: "day-1",
        date: "2026-09-01",
        title: "Day 1",
        items: [],
        ...overrides,
    };
}

describe("ItineraryDayAdditionalDetails", () => {
    it("renders nothing when a day has no venues and no parking locations (offline or online)", () => {
        const markup = renderToStaticMarkup(
            <ItineraryDayAdditionalDetails day={baseDay()} />,
        );

        expect(markup).toBe("");
    });

    it("renders nothing when venues/parkingLocations are present but empty arrays", () => {
        const markup = renderToStaticMarkup(
            <ItineraryDayAdditionalDetails
                day={baseDay({ venues: [], parkingLocations: [] })}
            />,
        );

        expect(markup).toBe("");
    });

    it("renders the recommended venues & parking button when a day has venues, matching offline presentation", () => {
        const markup = renderToStaticMarkup(
            <ItineraryDayAdditionalDetails
                day={baseDay({
                    venues: [{ id: "v1", name: "Caffe Roma" }],
                })}
            />,
        );

        expect(markup).toContain("Recommended venues &amp; parking");
        expect(markup).toContain("tc-button--subtle-success");
    });

    it("renders the recommended venues & parking button when a day has only parking locations", () => {
        const markup = renderToStaticMarkup(
            <ItineraryDayAdditionalDetails
                day={baseDay({
                    parkingLocations: [{ code: "P1", name: "Central Garage" }],
                })}
            />,
        );

        expect(markup).toContain("Recommended venues &amp; parking");
    });
});
