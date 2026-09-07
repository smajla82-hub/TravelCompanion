import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
        },
    });
});

import { trips } from "../data/trips";
import { TripService } from "./TripService";
import type { ItineraryItem, Trip } from "../types";

function trip(overrides: Partial<Trip> & { id: string }): Trip {
    return {
        destination: "Lago di Garda",
        country: "Italy",
        startDate: "2026-09-01",
        endDate: "2026-09-05",
        travellers: 2,
        status: "planning",
        ...overrides,
    };
}

function newItem(overrides: Partial<ItineraryItem> & { title: string }): Omit<ItineraryItem, "id"> {
    return {
        date: "2026-09-01",
        ...overrides,
    };
}

describe("TripService", () => {
    const originalTrips = [...trips];

    beforeEach(() => {
        trips.splice(
            0,
            trips.length,
            trip({ id: "offline-a", status: "active" }),
            trip({ id: "offline-b", status: "planning" }),
        );
    });

    afterEach(() => {
        trips.splice(0, trips.length, ...originalTrips);
        vi.restoreAllMocks();
    });

    it("keeps only one offline Trip locally active after Offline A to Offline B", () => {
        TripService.setActive("offline-b");

        expect(TripService.getAll().find(current => current.id === "offline-a")?.status)
            .toBe("planning");
        expect(TripService.getAll().find(current => current.id === "offline-b")?.status)
            .toBe("active");
        expect(TripService.getAll().filter(current => current.status === "active"))
            .toHaveLength(1);
    });

    describe("itinerary ordering", () => {
        function itemTitles(): string[] {
            return TripService.getAll()
                .find(current => current.id === "offline-a")
                ?.itinerary?.[0]?.items.map(item => item.title) ?? [];
        }

        beforeEach(() => {
            TripService.addItineraryItem("offline-a", "2026-09-01", newItem({ title: "Early", time: "08:00" }));
            TripService.addItineraryItem("offline-a", "2026-09-01", newItem({ title: "Late", time: "18:00" }));
        });

        it("inserts a new timed Activity into its chronological position", () => {
            TripService.addItineraryItem("offline-a", "2026-09-01", newItem({ title: "Middle", time: "12:00" }));

            expect(itemTitles()).toEqual(["Early", "Middle", "Late"]);
        });

        it("moves an edited Activity earlier when its time is moved earlier", () => {
            const itemId = TripService.getAll()
                .find(current => current.id === "offline-a")!
                .itinerary![0].items.find(item => item.title === "Late")!.id;

            TripService.updateItineraryItem("offline-a", "2026-09-01", itemId, { time: "07:00" });

            expect(itemTitles()).toEqual(["Late", "Early"]);
        });

        it("moves an edited Activity later when its time is moved later", () => {
            const itemId = TripService.getAll()
                .find(current => current.id === "offline-a")!
                .itinerary![0].items.find(item => item.title === "Early")!.id;

            TripService.updateItineraryItem("offline-a", "2026-09-01", itemId, { time: "19:00" });

            expect(itemTitles()).toEqual(["Late", "Early"]);
        });

        it("deletes only the selected Activity without disturbing the remaining order", () => {
            TripService.addItineraryItem("offline-a", "2026-09-01", newItem({ title: "Middle", time: "12:00" }));
            const middleId = TripService.getAll()
                .find(current => current.id === "offline-a")!
                .itinerary![0].items.find(item => item.title === "Middle")!.id;

            TripService.deleteItineraryItem("offline-a", "2026-09-01", middleId);

            expect(itemTitles()).toEqual(["Early", "Late"]);
        });

        it("keeps an untimed Activity after all timed Activities", () => {
            TripService.addItineraryItem("offline-a", "2026-09-01", newItem({ title: "Untimed" }));

            expect(itemTitles()).toEqual(["Early", "Late", "Untimed"]);
        });

        it("preserves insertion order for Activities sharing the same time", () => {
            TripService.addItineraryItem("offline-a", "2026-09-01", newItem({ title: "Same A", time: "10:00" }));
            TripService.addItineraryItem("offline-a", "2026-09-01", newItem({ title: "Same B", time: "10:00" }));

            expect(itemTitles()).toEqual(["Early", "Same A", "Same B", "Late"]);
        });

        it("keeps the same order after the itinerary is persisted and reconstructed", async () => {
            TripService.addItineraryItem("offline-a", "2026-09-01", newItem({ title: "Middle", time: "12:00" }));
            const expected = itemTitles();

            vi.resetModules();
            const reloaded = await import("./TripService");
            const reloadedTitles = reloaded.TripService.getAll()
                .find(current => current.id === "offline-a")
                ?.itinerary?.[0]?.items.map((item: ItineraryItem) => item.title) ?? [];

            expect(reloadedTitles).toEqual(expected);
        });
    });
});
