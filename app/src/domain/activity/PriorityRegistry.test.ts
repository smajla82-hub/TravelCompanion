import { describe, expect, it } from "vitest";

import {
    DEFAULT_PRIORITY_COLOR_VAR,
    PRIORITY_IDS,
    getPriorityColorVar,
    normalizePriority,
} from "./PriorityRegistry";

describe("normalizePriority", () => {
    it("normalizes canonical uppercase values", () => {
        expect(normalizePriority("MUST")).toBe("MUST");
        expect(normalizePriority("FOOD")).toBe("FOOD");
    });

    it("normalizes casing differences", () => {
        expect(normalizePriority("must")).toBe("MUST");
        expect(normalizePriority("Food")).toBe("FOOD");
    });

    it("trims surrounding whitespace", () => {
        expect(normalizePriority("  MUST  ")).toBe("MUST");
        expect(normalizePriority("\tfood\n")).toBe("FOOD");
    });

    it("resolves unknown values to undefined", () => {
        expect(normalizePriority("not-a-real-priority")).toBeUndefined();
    });

    it("resolves missing values to undefined", () => {
        expect(normalizePriority(undefined)).toBeUndefined();
        expect(normalizePriority(null)).toBeUndefined();
        expect(normalizePriority("")).toBeUndefined();
    });
});

describe("getPriorityColorVar", () => {
    it("returns a distinct color variable for every canonical priority", () => {
        const colorVars = PRIORITY_IDS.map(getPriorityColorVar);

        expect(new Set(colorVars).size).toBe(PRIORITY_IDS.length);
    });

    it("is case-insensitive and trims whitespace", () => {
        expect(getPriorityColorVar("must")).toBe(getPriorityColorVar("MUST"));
        expect(getPriorityColorVar("  MUST  ")).toBe(
            getPriorityColorVar("MUST")
        );
    });

    it("falls back to the neutral color for unknown or missing values", () => {
        expect(getPriorityColorVar("not-a-real-priority")).toBe(
            DEFAULT_PRIORITY_COLOR_VAR
        );
        expect(getPriorityColorVar(undefined)).toBe(
            DEFAULT_PRIORITY_COLOR_VAR
        );
        expect(getPriorityColorVar(null)).toBe(DEFAULT_PRIORITY_COLOR_VAR);
    });
});
