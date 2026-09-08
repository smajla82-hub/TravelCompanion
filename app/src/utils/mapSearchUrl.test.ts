import { describe, expect, it } from "vitest";

import {
    buildMapSearchQuery,
    getMapSearchUrl,
} from "./mapSearchUrl";

describe("map search URL", () => {
    it("combines title and location", () => {
        expect(buildMapSearchQuery("Museum", "Prague")).toBe(
            "Museum Prague",
        );
    });

    it("uses location when title is empty", () => {
        expect(buildMapSearchQuery("", " Prague ")).toBe("Prague");
    });

    it("uses title when location is empty", () => {
        expect(buildMapSearchQuery(" Museum ", "")).toBe("Museum");
    });

    it("supports Unicode and special characters", () => {
        const url = getMapSearchUrl(
            "Café & Museum",
            "Český Krumlov / centrum",
        );

        expect(url).toBe(
            "https://www.google.com/maps/search/?api=1&query=" +
                "Caf%C3%A9%20%26%20Museum%20%C4%8Cesk%C3%BD%20Krumlov%20%2F%20centrum",
        );
    });

    it("returns undefined for an empty search", () => {
        expect(getMapSearchUrl("  ", "\t")).toBeUndefined();
    });
});
