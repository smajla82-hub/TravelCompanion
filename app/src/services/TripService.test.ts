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
import type { Trip } from "../types";

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
});
