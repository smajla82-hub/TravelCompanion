import { describe, expect, it } from "vitest";

import { normalizeItineraryTime } from "./normalizeItineraryTime";

describe("normalizeItineraryTime", () => {
    it("pads single-digit hours to canonical HH:mm", () => {
        expect(normalizeItineraryTime("7:00")).toBe("07:00");
    });

    it("keeps already canonical HH:mm unchanged", () => {
        expect(normalizeItineraryTime("07:00")).toBe("07:00");
        expect(normalizeItineraryTime("12:15")).toBe("12:15");
        expect(normalizeItineraryTime("23:59")).toBe("23:59");
    });

    it("drops seconds from H:mm:ss and HH:mm:ss values", () => {
        expect(normalizeItineraryTime("7:00:00")).toBe("07:00");
        expect(normalizeItineraryTime("07:00:00")).toBe("07:00");
        expect(normalizeItineraryTime("9:35:00")).toBe("09:35");
        expect(normalizeItineraryTime("10:30:00")).toBe("10:30");
        expect(normalizeItineraryTime("12:15:00")).toBe("12:15");
    });

    it("trims surrounding whitespace", () => {
        expect(normalizeItineraryTime("  9:35  ")).toBe("09:35");
    });

    it("converts AM/PM designators to 24-hour time", () => {
        expect(normalizeItineraryTime("7:00 AM")).toBe("07:00");
        expect(normalizeItineraryTime("7:00 pm")).toBe("19:00");
        expect(normalizeItineraryTime("12:00 AM")).toBe("00:00");
        expect(normalizeItineraryTime("12:00 PM")).toBe("12:00");
        expect(normalizeItineraryTime("9:35:00 P.M.")).toBe("21:35");
    });

    it("converts Excel time serials to HH:mm", () => {
        expect(normalizeItineraryTime(0)).toBe("00:00");
        expect(normalizeItineraryTime(7 / 24)).toBe("07:00");
        expect(
            normalizeItineraryTime(0.3993055555555556)
        ).toBe("09:35");
        expect(normalizeItineraryTime(10.5 / 24)).toBe("10:30");
        expect(normalizeItineraryTime(12.25 / 24)).toBe("12:15");
    });

    it("rejects numbers that are not pure time-of-day serials", () => {
        expect(normalizeItineraryTime(-0.5)).toBe("");
        expect(normalizeItineraryTime(1)).toBe("");
        expect(normalizeItineraryTime(45000.5)).toBe("");
        expect(normalizeItineraryTime(0.5 + 1 / 1440 / 2)).toBe("");
        expect(normalizeItineraryTime(NaN)).toBe("");
        expect(normalizeItineraryTime(Infinity)).toBe("");
    });

    it("reads Date values as UTC wall-clock time", () => {
        expect(
            normalizeItineraryTime(
                new Date("1899-12-30T07:00:00.000Z")
            )
        ).toBe("07:00");
        expect(
            normalizeItineraryTime(
                new Date("1899-12-30T09:35:00.000Z")
            )
        ).toBe("09:35");
    });

    it("rejects invalid Dates", () => {
        expect(normalizeItineraryTime(new Date(NaN))).toBe("");
    });

    it("keeps missing or invalid times as empty string", () => {
        expect(normalizeItineraryTime("")).toBe("");
        expect(normalizeItineraryTime(null)).toBe("");
        expect(normalizeItineraryTime(undefined)).toBe("");
        expect(normalizeItineraryTime(true)).toBe("");
        expect(normalizeItineraryTime("invalid")).toBe("");
        expect(normalizeItineraryTime("~16:30")).toBe("");
        expect(normalizeItineraryTime("25:00")).toBe("");
        expect(normalizeItineraryTime("12:61")).toBe("");
        expect(normalizeItineraryTime("13:00 PM")).toBe("");
    });
});
