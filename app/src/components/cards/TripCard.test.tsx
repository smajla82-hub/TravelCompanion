import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TripCard } from "./TripCard";

const trip = {
    id: "trip-1",
    destination: "A very long destination name that must be able to wrap safely in its card",
    country: "US",
    startDate: "2026-09-01",
    endDate: "2026-09-05",
    travellers: 2,
    status: "planning" as const,
};

describe("TripCard", () => {
    it("renders semantic online source status and canonical country metadata", () => {
        const markup = renderToStaticMarkup(<TripCard trip={trip} badge="Online" />);
        expect(markup).toContain("trip-source-status--online");
        expect(markup).toContain("🇺🇸");
        expect(markup).toContain("United States");
    });

    it("renders neutral offline source status", () => {
        const markup = renderToStaticMarkup(<TripCard trip={trip} />);
        expect(markup).toContain("trip-source-status--offline");
        expect(markup).toContain("Offline");
    });
});
