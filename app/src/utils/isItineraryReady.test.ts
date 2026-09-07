import { describe, expect, it } from "vitest";

import { isItineraryReady } from "./isItineraryReady";

describe("isItineraryReady", () => {
    it("is not ready when there is no active Trip", () => {
        expect(isItineraryReady(undefined)).toBe(false);
    });

    it("is always ready for an Offline Trip", () => {
        expect(isItineraryReady({ source: "local", itineraryLoaded: false })).toBe(true);
        expect(isItineraryReady({ source: "local", itineraryLoaded: undefined })).toBe(true);
    });

    it("is not ready for an Online Trip whose itinerary has not loaded yet", () => {
        expect(isItineraryReady({ source: "online", itineraryLoaded: false })).toBe(false);
        expect(isItineraryReady({ source: "online", itineraryLoaded: undefined })).toBe(false);
    });

    it("is ready for an Online Trip once its itinerary has loaded", () => {
        expect(isItineraryReady({ source: "online", itineraryLoaded: true })).toBe(true);
    });
});
