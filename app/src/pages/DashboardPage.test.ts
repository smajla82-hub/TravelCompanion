import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
        },
    });
});

import { scrollToItinerary } from "./scrollToItinerary";

describe("scrollToItinerary", () => {
    it("waits when the itinerary target has not mounted", () => {
        expect(scrollToItinerary({ getElementById: () => null })).toBe(false);
    });

    it("scrolls the mounted itinerary target", () => {
        const scrollIntoView = vi.fn();

        expect(scrollToItinerary({
            getElementById: () => ({ scrollIntoView }) as unknown as HTMLElement,
        })).toBe(true);
        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
    });
});
