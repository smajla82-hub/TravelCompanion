import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RecommendedVenueList } from "./RecommendedVenueList";

import type { RecommendedVenue } from "../../types";

const venues: RecommendedVenue[] = [
    { id: "v1", name: "Caffe Roma" },
    { id: "v2", name: "Trattoria Bella" },
    { id: "v3", name: "Sushi Place" },
];

describe("RecommendedVenueList", () => {
    it("renders the shared itinerary separator once between every venue", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueList venues={venues} />
        );

        const separatorCount = (
            markup.match(/itinerary-activity-separator/g) ?? []
        ).length;
        const rowCount = (
            markup.match(/itinerary-activity-row/g) ?? []
        ).length;

        expect(rowCount).toBe(venues.length);
        expect(separatorCount).toBe(venues.length);
    });

    it("renders the empty message when there are no venues", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueList venues={[]} emptyMessage="Nothing here" />
        );

        expect(markup).toContain("Nothing here");
        expect(markup).not.toContain("itinerary-activity-row");
    });
});
