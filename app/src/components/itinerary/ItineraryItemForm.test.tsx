import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
    ItineraryItemForm,
} from "./ItineraryItemForm";
import { openMapSearch } from "../../utils/mapSearchUrl";

describe("ItineraryItemForm", () => {
    it("opens the expected Google Maps search URL", () => {
        const openWindow = (url: string, target: string, features: string) => {
            expect(url).toBe(
                "https://www.google.com/maps/search/?api=1&query=Old%20Town",
            );
            expect(target).toBe("_blank");
            expect(features).toBe("noopener,noreferrer");
        };

        expect(openMapSearch("Old Town", openWindow)).toBe(true);
    });

    it("renders Find on Map without changing imported Smart Chip fields", () => {
        const markup = renderToStaticMarkup(
            <ItineraryItemForm
                item={{
                    id: "activity-1",
                    date: "2026-09-08",
                    title: "Old Town",
                    location: "Prague",
                    smartChip: "Imported Old Town",
                    mapLink: "https://maps.google.com/imported-place",
                }}
                onSubmit={() => {}}
            />,
        );

        expect(markup).toContain("Find on Map");
        expect(markup).toContain('value="Imported Old Town"');
        expect(markup).toContain(
            'value="https://maps.google.com/imported-place"',
        );
    });

    it("places Find on Map below Smart Chip and disables it when empty", () => {
        const markup = renderToStaticMarkup(
            <ItineraryItemForm onSubmit={() => {}} />,
        );

        expect(markup).toContain("Find on Map");
        expect(markup).toContain("disabled");
        expect(markup.indexOf("Smart Chip")).toBeLessThan(
            markup.indexOf("Find on Map"),
        );
    });
});
