import { describe, expect, it } from "vitest";

import type { ItineraryItem } from "../../types";
import { sortItineraryItems } from "./sortItineraryItems";

function item(id: string, time?: string): ItineraryItem {
    return { id, time, title: id, date: "2026-09-10" };
}

describe("sortItineraryItems", () => {
    it("sorts activities chronologically", () => {
        expect(
            sortItineraryItems([
                item("08:00", "08:00"),
                item("12:00", "12:00"),
                item("18:00", "18:00"),
                item("10:00", "10:00"),
            ]).map(({ id }) => id)
        ).toEqual(["08:00", "10:00", "12:00", "18:00"]);
    });

    it("moves an edited activity to its chronological position", () => {
        expect(
            sortItineraryItems([
                item("08:00", "08:00"),
                item("10:00", "14:00"),
                item("12:00", "12:00"),
            ]).map(({ id }) => id)
        ).toEqual(["08:00", "12:00", "10:00"]);
    });

    it("preserves the order of activities with equal times", () => {
        expect(
            sortItineraryItems([
                item("A", "10:00"),
                item("B", "10:00"),
            ]).map(({ id }) => id)
        ).toEqual(["A", "B"]);
    });

    it("places missing or invalid times after valid times", () => {
        expect(
            sortItineraryItems([
                item("08:00", "08:00"),
                item("invalid", "invalid"),
                item("12:00", "12:00"),
                item("missing"),
            ]).map(({ id }) => id)
        ).toEqual(["08:00", "12:00", "invalid", "missing"]);
    });
});
