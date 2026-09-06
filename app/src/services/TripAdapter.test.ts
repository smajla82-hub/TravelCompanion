import { describe, expect, it, vi } from "vitest";

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

import { toOnlineTrip } from "./TripAdapter";
import type { SyncedTrip } from "../api/trips";

function serverTrip(overrides: Partial<SyncedTrip> = {}): SyncedTrip {
    return {
        id: "trip-1",
        name: "Garda",
        destination: "Riva del Garda",
        country: "Italy",
        startDate: "2026-09-01",
        endDate: "2026-09-05",
        travellers: 2,
        status: "planning",
        ...overrides,
    };
}

describe("toOnlineTrip", () => {
    it("marks the server side active trip as active", () => {
        expect(toOnlineTrip(serverTrip({ isActive: true }))).toMatchObject({
            status: "active",
            source: "online",
            name: "Garda",
        });
    });

    it("does not treat a non active trip as active", () => {
        expect(toOnlineTrip(serverTrip({ status: "active", isActive: false })).status)
            .toBe("planning");
    });

    it("keeps the stored status when the server omits the active flag", () => {
        expect(toOnlineTrip(serverTrip({ status: "finished" })).status).toBe("finished");
    });
});
