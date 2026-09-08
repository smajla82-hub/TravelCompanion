import { describe, expect, it } from "vitest";

import {
    buildMapSearchQuery,
    getMapSearchUrl,
} from "./mapSearchUrl";

describe("map search URL", () => {
    it("uses the exact supplied Smart Chip query", () => {
        expect(buildMapSearchQuery("Battleship USS Iowa Museum")).toBe(
            "Battleship USS Iowa Museum",
        );
    });

    it("supports Unicode and special characters", () => {
        const url = getMapSearchUrl(
            "Café & Museum",
        );

        expect(url).toBe(
            "https://www.google.com/maps/search/?api=1&query=" +
                "Caf%C3%A9%20%26%20Museum",
        );
    });

    it("returns undefined for an empty search", () => {
        expect(getMapSearchUrl("  ")).toBeUndefined();
    });
});
