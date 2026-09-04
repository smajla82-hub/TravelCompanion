import { describe, expect, it } from "vitest";

import type { ItineraryDay } from "../../types";
import { sortItineraryDays } from "./sortItineraryDays";

function day(date: string): ItineraryDay {
    return {
        id: `day-${date}`,
        date,
        title: date,
        items: [],
    };
}

describe("sortItineraryDays", () => {
    it("orders days chronologically by date", () => {
        expect(
            sortItineraryDays([
                day("2026-09-12"),
                day("2026-09-10"),
                day("2026-09-11"),
            ]).map(day => day.date)
        ).toEqual([
            "2026-09-10",
            "2026-09-11",
            "2026-09-12",
        ]);
    });
});
