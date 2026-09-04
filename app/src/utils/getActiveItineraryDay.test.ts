import { describe, expect, it } from "vitest";

import { isActiveItineraryDay } from "./getActiveItineraryDay";

const trip = {
    startDate: "2026-09-10",
    endDate: "2026-09-17",
};

describe("isActiveItineraryDay", () => {
    it("returns false when the trip has not started yet", () => {
        expect(
            isActiveItineraryDay(
                "2026-09-10",
                trip,
                new Date("2026-09-09T12:00:00")
            )
        ).toBe(false);
    });

    it("returns false once the trip has ended", () => {
        expect(
            isActiveItineraryDay(
                "2026-09-17",
                trip,
                new Date("2026-09-18T12:00:00")
            )
        ).toBe(false);
    });

    it("returns true for today's day on the trip's first day", () => {
        expect(
            isActiveItineraryDay(
                "2026-09-10",
                trip,
                new Date("2026-09-10T08:00:00")
            )
        ).toBe(true);
    });

    it("returns true for today's day on the trip's last day", () => {
        expect(
            isActiveItineraryDay(
                "2026-09-17",
                trip,
                new Date("2026-09-17T23:00:00")
            )
        ).toBe(true);
    });

    it("returns false for a day that does not match today", () => {
        expect(
            isActiveItineraryDay(
                "2026-09-11",
                trip,
                new Date("2026-09-12T08:00:00")
            )
        ).toBe(false);
    });
});
