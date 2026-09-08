import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
    ItineraryItemForm,
    openActivityMapSearch,
} from "./ItineraryItemForm";

describe("ItineraryItemForm", () => {
    it("opens the expected Google Maps search URL", () => {
        const openWindow = (url: string, target: string, features: string) => {
            expect(url).toBe(
                "https://www.google.com/maps/search/?api=1&query=Old%20Town%20Prague",
            );
            expect(target).toBe("_blank");
            expect(features).toBe("noopener,noreferrer");
        };

        expect(openActivityMapSearch("Old Town", "Prague", openWindow)).toBe(
            true,
        );
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

    it("disables Find on Map when title and location are empty", () => {
        const markup = renderToStaticMarkup(
            <ItineraryItemForm onSubmit={() => {}} />,
        );

        expect(markup).toContain("Find on Map");
        expect(markup).toContain("disabled");
    });
});
