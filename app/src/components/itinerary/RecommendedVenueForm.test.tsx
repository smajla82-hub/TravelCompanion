import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RecommendedVenueForm } from "./RecommendedVenueForm";

import type { RecommendedVenue } from "../../types";

describe("RecommendedVenueForm", () => {
    it("renders a controlled Priority dropdown with only Main and Backup, no emoji", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueForm onSubmit={() => {}} />
        );

        expect(markup).toContain("<select");
        expect(markup).toContain('value="Main"');
        expect(markup).toContain('value="Backup"');
        expect(markup).not.toContain("⭐");
        expect(markup).not.toContain("🔄");
    });

    it("defaults to Main for a new venue", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueForm onSubmit={() => {}} />
        );

        expect(markup).toContain('<option value="Main" selected');
    });

    it("resolves an imported Czech/emoji priority to the matching dropdown option", () => {
        const venue: RecommendedVenue = {
            id: "v1",
            name: "Letiště Praha",
            priority: "⭐ Hlavní",
        };

        const markup = renderToStaticMarkup(
            <RecommendedVenueForm venue={venue} onSubmit={() => {}} />
        );

        expect(markup).toContain('<option value="Main" selected');
    });

    it("resolves an imported Backup value to the Backup dropdown option", () => {
        const venue: RecommendedVenue = {
            id: "v1",
            name: "Chick-fil-A Fullerton",
            priority: "🔄 Záložní",
        };

        const markup = renderToStaticMarkup(
            <RecommendedVenueForm venue={venue} onSubmit={() => {}} />
        );

        expect(markup).toContain('<option value="Backup" selected');
    });

    it("renders an enabled Smart Chip-based Find on Map action without changing imported fields", () => {
        const markup = renderToStaticMarkup(
            <RecommendedVenueForm
                venue={{
                    id: "v1",
                    name: "The Kettle Manhattan Beach",
                    smartChip: "The Kettle",
                    mapLink: "https://maps.example.com/the-kettle",
                    parking: "P4",
                }}
                onSubmit={() => {}}
            />,
        );

        expect(markup).toContain("Find on Map");
        expect(markup).toContain('value="The Kettle"');
        expect(markup).toContain('value="https://maps.example.com/the-kettle"');
    });
});
