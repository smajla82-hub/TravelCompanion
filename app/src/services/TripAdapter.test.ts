import { afterEach, describe, expect, it, vi } from "vitest";

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

import { createTripAdapter, toOnlineTrip } from "./TripAdapter";
import { SyncedTripApi, type SyncedTrip } from "../api/trips";

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

    describe("online Trip adapter", () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it("updates the server name with the edited destination for consistent labels", async () => {
            vi.spyOn(SyncedTripApi, "acquireLock").mockResolvedValue({});
            vi.spyOn(SyncedTripApi, "releaseLock").mockResolvedValue({});
            const update = vi.spyOn(SyncedTripApi, "update")
                .mockResolvedValue(serverTrip({ name: "Olomouc", destination: "Olomouc" }));

            const saved = await createTripAdapter({
                ...serverTrip({ name: "Brno", destination: "Brno" }),
                source: "online",
            }).updateTrip({
                ...toOnlineTrip(serverTrip({ name: "Brno", destination: "Brno" })),
                destination: "Olomouc",
            });

            expect(update).toHaveBeenCalledWith(
                "trip-1",
                expect.objectContaining({
                    destination: "Olomouc",
                    name: "Olomouc",
                }),
            );
            expect(saved).toMatchObject({
                destination: "Olomouc",
                name: "Olomouc",
            });
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
