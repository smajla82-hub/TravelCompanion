import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RecommendedVenueManageRow } from "./RecommendedVenueManageRow";

import type { RecommendedVenue } from "../../types";

const venue: RecommendedVenue = {
    id: "v1",
    name: "Caffe Roma",
    priority: "Main",
};

describe("RecommendedVenueManageRow", () => {
    it("places the Manage button after the venue content, inside the same content column", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueManageRow venue={venue} editable onManage={() => {}} />
        );

        const contentStart = markup.indexOf("itinerary-activity-content");
        const nameIndex = markup.indexOf("Caffe Roma");
        const manageIndex = markup.indexOf(">Manage<");
        const contentEnd = markup.indexOf(
            "itinerary-activity-separator"
        );

        expect(contentStart).toBeGreaterThan(-1);
        expect(nameIndex).toBeGreaterThan(contentStart);
        expect(manageIndex).toBeGreaterThan(nameIndex);
        expect(manageIndex).toBeLessThan(contentEnd);
    });

    it("renders the shared itinerary separator after the complete venue + Manage block", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueManageRow venue={venue} editable onManage={() => {}} />
        );

        expect(markup).toContain("itinerary-activity-row");
        expect(markup).toContain("itinerary-activity-separator");
    });

    it("hides the Manage button when not editable", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueManageRow venue={venue} editable={false} />
        );

        expect(markup).not.toContain("Manage");
    });
});
