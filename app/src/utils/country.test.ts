import { describe, expect, it } from "vitest";

import {
    getCountry,
    getCountryDisplayName,
    getCountryFlag,
    isCountryCode,
    normalizeCountry,
    searchCountries,
} from "./country";

describe("country metadata", () => {
    it.each([
        ["United States", "US"],
        ["USA", "US"],
        ["US", "US"],
        ["Czech Republic", "CZ"],
        ["Italy", "IT"],
        ["IT", "IT"],
    ])("normalizes %s to %s", (value, expected) => {
        expect(normalizeCountry(value)).toBe(expected);
    });

    it("preserves unknown legacy values without guessing", () => {
        expect(normalizeCountry("Atlantis")).toBe("Atlantis");
        expect(normalizeCountry(normalizeCountry("Atlantis"))).toBe("Atlantis");
    });

    it("validates codes and resolves canonical names and flags", () => {
        expect(isCountryCode("US")).toBe(true);
        expect(isCountryCode("United States")).toBe(false);
        expect(getCountry("US")).toMatchObject({ name: "United States", flag: "🇺🇸" });
        expect(getCountryDisplayName("IT")).toBe("Italy");
        expect(getCountryFlag("CZ")).toBe("🇨🇿");
        expect(getCountryFlag("Atlantis")).toBe("🌍");
    });

    it("finds selector options by country name or ISO code", () => {
        expect(searchCountries("United Sta")).toContainEqual(
            expect.objectContaining({ code: "US" }),
        );
        expect(searchCountries("CZ")).toContainEqual(
            expect.objectContaining({ name: "Czechia" }),
        );
    });
});
