import { describe, expect, it } from "vitest";

import {
    DEFAULT_VENUE_PRIORITY_COLOR_VAR,
    VENUE_PRIORITY_BACKUP,
    VENUE_PRIORITY_MAIN,
    VENUE_PRIORITY_OPTIONS,
    getVenuePriorityColorVar,
    normalizeVenuePriority,
} from "./VenuePriorityRegistry";

describe("normalizeVenuePriority", () => {
    it("normalizes the canonical dropdown values", () => {
        expect(normalizeVenuePriority("Main")).toBe(VENUE_PRIORITY_MAIN);
        expect(normalizeVenuePriority("Backup")).toBe(VENUE_PRIORITY_BACKUP);
    });

    it("normalizes casing differences", () => {
        expect(normalizeVenuePriority("main")).toBe(VENUE_PRIORITY_MAIN);
        expect(normalizeVenuePriority("BACKUP")).toBe(VENUE_PRIORITY_BACKUP);
    });

    it("normalizes imported RoadBook Czech/emoji values", () => {
        expect(normalizeVenuePriority("⭐ Hlavní")).toBe(VENUE_PRIORITY_MAIN);
        expect(normalizeVenuePriority("🔄 Záložní")).toBe(
            VENUE_PRIORITY_BACKUP
        );
    });

    it("returns undefined for unrecognized or missing values", () => {
        expect(normalizeVenuePriority("something else")).toBeUndefined();
        expect(normalizeVenuePriority(undefined)).toBeUndefined();
        expect(normalizeVenuePriority(null)).toBeUndefined();
        expect(normalizeVenuePriority("")).toBeUndefined();
    });

    it("exposes exactly Main and Backup as controlled options", () => {
        expect(VENUE_PRIORITY_OPTIONS).toEqual(["Main", "Backup"]);
    });
});

describe("getVenuePriorityColorVar", () => {
    it("returns distinct semantic color variables for Main and Backup", () => {
        expect(getVenuePriorityColorVar("Main")).toBe(
            "--color-venue-priority-main"
        );
        expect(getVenuePriorityColorVar("Backup")).toBe(
            "--color-venue-priority-backup"
        );
        expect(getVenuePriorityColorVar("Main")).not.toBe(
            getVenuePriorityColorVar("Backup")
        );
    });

    it("resolves imported Czech/emoji values to the same colors", () => {
        expect(getVenuePriorityColorVar("⭐ Hlavní")).toBe(
            getVenuePriorityColorVar("Main")
        );
        expect(getVenuePriorityColorVar("🔄 Záložní")).toBe(
            getVenuePriorityColorVar("Backup")
        );
    });

    it("falls back to the neutral color for unknown values", () => {
        expect(getVenuePriorityColorVar("unknown")).toBe(
            DEFAULT_VENUE_PRIORITY_COLOR_VAR
        );
        expect(getVenuePriorityColorVar(undefined)).toBe(
            DEFAULT_VENUE_PRIORITY_COLOR_VAR
        );
    });
});
