import { describe, expect, it } from "vitest";

import { getRemainingItineraryItems } from "./getItineraryItemTiming";
import type { ItineraryItem } from "../types";

const day = { date: "2026-09-12" };

function item(
    id: string,
    time?: string
): ItineraryItem {
    return {
        id,
        time,
        title: id,
        date: day.date,
    };
}

describe("getRemainingItineraryItems", () => {
    it("filters out activities whose scheduled start time has already passed", () => {
        const items = [
            item("breakfast", "08:00"),
            item("lunch", "12:00"),
            item("dinner", "19:00"),
        ];

        const remaining = getRemainingItineraryItems(
            day,
            items,
            new Date("2026-09-12T13:00:00")
        );

        expect(remaining.map(i => i.id)).toEqual([
            "lunch",
            "dinner",
        ]);
    });

    it("keeps the current activity and all upcoming/future activities", () => {
        const items = [
            item("past", "08:00"),
            item("current", "12:00"),
            item("next", "14:00"),
            item("future", "18:00"),
        ];

        const remaining = getRemainingItineraryItems(
            day,
            items,
            new Date("2026-09-12T12:30:00")
        );

        expect(remaining.map(i => i.id)).toEqual([
            "current",
            "next",
            "future",
        ]);
    });

    it("keeps activities with missing or invalid times", () => {
        const items = [
            item("past", "08:00"),
            item("no-time", undefined),
            item("invalid-time", "not-a-time"),
        ];

        const remaining = getRemainingItineraryItems(
            day,
            items,
            new Date("2026-09-12T13:00:00")
        );

        expect(remaining.map(i => i.id)).toEqual([
            "no-time",
            "invalid-time",
        ]);
    });

    it("returns an empty list when every timed activity has finished and there are no untimed ones", () => {
        const items = [
            item("breakfast", "08:00"),
            item("lunch", "12:00"),
        ];

        const remaining = getRemainingItineraryItems(
            day,
            items,
            new Date("2026-09-12T23:00:00")
        );

        expect(remaining).toEqual([]);
    });

    it("returns the full list unfiltered when the day is not today", () => {
        const items = [
            item("breakfast", "08:00"),
            item("lunch", "12:00"),
        ];

        const remaining = getRemainingItineraryItems(
            day,
            items,
            new Date("2026-09-13T23:00:00")
        );

        expect(remaining.map(i => i.id)).toEqual([
            "breakfast",
            "lunch",
        ]);
    });
});
