import { describe, expect, it } from "vitest";

import {
    ACTIVITY_TYPE_IDS,
    ACTIVITY_TYPE_REGISTRY,
    DEFAULT_ACTIVITY_TYPE,
    getActivityTypeDefinition,
    normalizeActivityType,
} from "./ActivityTypeRegistry";

describe("normalizeActivityType", () => {
    it("normalizes canonical lowercase values", () => {
        expect(normalizeActivityType("food")).toBe("food");
        expect(normalizeActivityType("scenic")).toBe("scenic");
    });

    it("normalizes casing differences", () => {
        expect(normalizeActivityType("FOOD")).toBe("food");
        expect(normalizeActivityType("Food")).toBe("food");
        expect(normalizeActivityType("SCENIC")).toBe("scenic");
    });

    it("trims surrounding whitespace", () => {
        expect(normalizeActivityType("  food  ")).toBe("food");
        expect(normalizeActivityType("\tSCENIC\n")).toBe("scenic");
    });

    it("resolves unknown values to the other fallback", () => {
        expect(normalizeActivityType("not-a-real-type")).toBe("other");
        expect(normalizeActivityType("Cíl")).toBe("other");
    });

    it("resolves missing values to the other fallback", () => {
        expect(normalizeActivityType(undefined)).toBe("other");
        expect(normalizeActivityType(null)).toBe("other");
        expect(normalizeActivityType("")).toBe("other");
    });

    it("never returns a value outside the canonical set", () => {
        for (const raw of ["Food", "FLIGHT", "unknown", "", "  "]) {
            expect(ACTIVITY_TYPE_IDS).toContain(
                normalizeActivityType(raw)
            );
        }
    });
});

describe("ACTIVITY_TYPE_REGISTRY", () => {
    it("defines every canonical activity type", () => {
        for (const id of ACTIVITY_TYPE_IDS) {
            expect(ACTIVITY_TYPE_REGISTRY[id]).toBeDefined();
            expect(ACTIVITY_TYPE_REGISTRY[id].id).toBe(id);
            expect(ACTIVITY_TYPE_REGISTRY[id].label).toBeTruthy();
            expect(ACTIVITY_TYPE_REGISTRY[id].icon).toBeTruthy();
        }
    });

    it("maps distinct activity types to distinct icons", () => {
        const icons = ACTIVITY_TYPE_IDS.map(
            id => ACTIVITY_TYPE_REGISTRY[id].icon
        );

        expect(new Set(icons).size).toBe(icons.length);
    });

    it("has 'other' as the default fallback", () => {
        expect(DEFAULT_ACTIVITY_TYPE).toBe("other");
    });
});

describe("getActivityTypeDefinition", () => {
    it("returns the correct icon for known activity types", () => {
        expect(getActivityTypeDefinition("food").icon).toBe("utensils");
        expect(getActivityTypeDefinition("flight").icon).toBe("plane");
        expect(getActivityTypeDefinition("transport").icon).toBe("car");
        expect(getActivityTypeDefinition("car_rental").icon).toBe("key");
    });

    it("falls back to 'other' for missing/undefined values", () => {
        expect(getActivityTypeDefinition(undefined).id).toBe("other");
        expect(getActivityTypeDefinition(null).id).toBe("other");
    });

    it("falls back to 'other' for unknown values", () => {
        expect(getActivityTypeDefinition("spaceship").id).toBe("other");
    });
});
