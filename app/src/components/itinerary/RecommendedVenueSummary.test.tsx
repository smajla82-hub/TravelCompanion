import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RecommendedVenueSummary } from "./RecommendedVenueSummary";

import type { RecommendedVenue } from "../../types";

function baseVenue(overrides: Partial<RecommendedVenue> = {}): RecommendedVenue {
    return {
        id: "v1",
        name: "Caffe Roma",
        ...overrides,
    };
}

describe("RecommendedVenueSummary", () => {
    it("displays a canonical Main priority in the success color", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueSummary venue={baseVenue({ priority: "Main" })} />
        );

        expect(markup).toContain("Main");
        expect(markup).toContain("var(--color-venue-priority-main)");
    });

    it("displays a canonical Backup priority in the light-blue color", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueSummary
                venue={baseVenue({ priority: "Backup" })}
            />
        );

        expect(markup).toContain("Backup");
        expect(markup).toContain("var(--color-venue-priority-backup)");
    });

    it("normalizes imported Czech/emoji priority values to Main/Backup", () => {
        const mainMarkup = renderToStaticMarkup(
            <RecommendedVenueSummary
                venue={baseVenue({ priority: "⭐ Hlavní" })}
            />
        );

        expect(mainMarkup).toContain("Main");
        expect(mainMarkup).not.toContain("Hlavní");
        expect(mainMarkup).toContain("var(--color-venue-priority-main)");

        const backupMarkup = renderToStaticMarkup(
            <RecommendedVenueSummary
                venue={baseVenue({ priority: "🔄 Záložní" })}
            />
        );

        expect(backupMarkup).toContain("Backup");
        expect(backupMarkup).toContain("var(--color-venue-priority-backup)");
    });

    it("renders the venue name and other details", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueSummary
                venue={baseVenue({
                    subtype: "Sandwich",
                    price: "15 USD",
                    reservation: "Yes",
                    recommendation: "Great sandwiches",
                })}
            />
        );

        expect(markup).toContain("Caffe Roma");
        expect(markup).toContain("Sandwich");
        expect(markup).toContain("Price/person: 15 USD");
        expect(markup).toContain("Reservation: Yes");
        expect(markup).toContain("Great sandwiches");
    });
});
