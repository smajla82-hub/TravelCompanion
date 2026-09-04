import { describe, expect, it } from "vitest";

import {
    TEXT_LIMITS,
    counterClassName,
    exceedsTextLimit,
    formatCharacterCounter,
} from "./textLimits";

describe("textLimits", () => {
    it("exposes the single source of truth for maximum text lengths", () => {
        expect(TEXT_LIMITS).toEqual({
            tripName: 40,
            dayTitle: 40,
            activityTitle: 40,
            location: 26,
            price: 26,
            note: 60,
            mapLink: 2048,
        });
    });

    it("does not flag values at or under the limit", () => {
        expect(exceedsTextLimit("A".repeat(26), "location")).toBe(false);
        expect(exceedsTextLimit("", "note")).toBe(false);
        expect(exceedsTextLimit(undefined, "price")).toBe(false);
    });

    it("flags values that exceed the limit", () => {
        expect(exceedsTextLimit("A".repeat(27), "location")).toBe(true);
        expect(exceedsTextLimit("A".repeat(61), "note")).toBe(true);
    });

    it("formats a compact current/maximum counter", () => {
        expect(formatCharacterCounter("A".repeat(26), "location")).toBe(
            "26 / 26"
        );
        expect(formatCharacterCounter("", "activityTitle")).toBe("0 / 40");
    });

    it("flags the counter class name when exceeded", () => {
        expect(counterClassName("A".repeat(26), "location")).toBe(
            "tc-char-counter"
        );
        expect(counterClassName("A".repeat(27), "location")).toBe(
            "tc-char-counter tc-char-counter--exceeded"
        );
    });
});
