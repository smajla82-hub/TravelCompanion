import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// TripService reads localStorage while it is imported, so a stub has to exist
// before the modules under test are loaded.
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

import { SyncedTripApi, type SyncedTrip } from "../api/trips";
import { ApiError } from "../api/client";
import { OnlineTripStore } from "./OnlineTripStore";
import { toOnlineTrip } from "./TripAdapter";
import { selectActiveTrip } from "../utils/selectActiveTrip";
import type { Trip } from "../types";

function syncedTrip(overrides: Partial<SyncedTrip> & { id: string }): SyncedTrip {
    return {
        name: `Trip ${overrides.id}`,
        destination: `Destination ${overrides.id}`,
        country: "Italy",
        startDate: "2026-09-01",
        endDate: "2026-09-05",
        travellers: 2,
        status: "planning",
        ...overrides,
    };
}

function stubServer(trips: SyncedTrip[]) {
    vi.spyOn(SyncedTripApi, "list").mockImplementation(async () => trips);
    vi.spyOn(SyncedTripApi, "get").mockImplementation(async id => {
        const found = trips.find(trip => trip.id === id);
        if (!found) throw new Error("Trip not found.");
        return found;
    });
    vi.spyOn(SyncedTripApi, "itinerary").mockImplementation(async id => ({ tripId: id, days: [] }));
}

describe("OnlineTripStore", () => {
    beforeEach(() => {
        const storage = new Map<string, string>([["travel-companion.auth-token", "test-token"]]);
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
        });
        OnlineTripStore.reset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        OnlineTripStore.reset();
    });

    it("loads online trips from the server list endpoint", async () => {
        stubServer([syncedTrip({ id: "trip-1", isActive: true })]);

        const loaded = await OnlineTripStore.refresh();

        expect(SyncedTripApi.get).not.toHaveBeenCalled();
        expect(SyncedTripApi.itinerary).not.toHaveBeenCalled();
        expect(loaded).toHaveLength(1);
        expect(selectActiveTrip(loaded)?.id).toBe("trip-1");
        expect(OnlineTripStore.getSnapshot()[0]).toMatchObject({
            id: "trip-1",
            source: "online",
            name: "Trip trip-1",
        });
    });

    it("shows a newly created online trip without reloading the page", async () => {
        const trips = [syncedTrip({ id: "trip-1" })];
        stubServer(trips);
        await OnlineTripStore.refresh();

        const changes: number[] = [];
        const unsubscribe = OnlineTripStore.subscribe(() => changes.push(OnlineTripStore.getSnapshot().length));

        trips.push(syncedTrip({ id: "trip-2", name: "Garda" }));
        await OnlineTripStore.refresh();
        unsubscribe();

        expect(changes).toContain(2);
        expect(OnlineTripStore.getSnapshot().map(trip => trip.id)).toEqual(["trip-1", "trip-2"]);
        expect(OnlineTripStore.getSnapshot().every(trip => trip.source === "online")).toBe(true);
    });

    it("marks the activated online trip active and clears the previous one", async () => {
        stubServer([
            syncedTrip({ id: "trip-1", isActive: true }),
            syncedTrip({ id: "trip-2" }),
        ]);
        await OnlineTripStore.refresh();

        let notified = false;
        const unsubscribe = OnlineTripStore.subscribe(() => { notified = true; });

        OnlineTripStore.applyTrip(toOnlineTrip(syncedTrip({ id: "trip-2", isActive: true })));
        unsubscribe();

        const snapshot = OnlineTripStore.getSnapshot();
        expect(notified).toBe(true);
        expect(snapshot.find(trip => trip.id === "trip-2")?.status).toBe("active");
        expect(snapshot.find(trip => trip.id === "trip-1")?.status).toBe("planning");
        expect(snapshot.filter(trip => trip.status === "active")).toHaveLength(1);
    });

    it("keeps the cached itinerary when the server response omits it", async () => {
        OnlineTripStore.applyTrip({
            ...toOnlineTrip(syncedTrip({ id: "trip-1" })),
            itinerary: [{ id: "day-1", date: "2026-09-01", title: "Arrival", items: [] }],
        });

        OnlineTripStore.applyTrip({
            ...syncedTrip({ id: "trip-1", destination: "Riva" }),
            itinerary: [],
            source: "online",
        } as Trip);

        const trip = OnlineTripStore.getSnapshot()[0];
        expect(trip.destination).toBe("Riva");
        expect(trip.itinerary).toHaveLength(1);
    });

    it("does not blank the online list when optional secondary resources fail", async () => {
        stubServer([syncedTrip({ id: "trip-1" })]);
        vi.mocked(SyncedTripApi.itinerary).mockRejectedValue(new Error("Itinerary failed."));

        await OnlineTripStore.refresh();

        expect(OnlineTripStore.getSnapshot().map(trip => trip.id)).toEqual(["trip-1"]);
        expect(SyncedTripApi.itinerary).not.toHaveBeenCalled();
    });

    it("retains the cached list when a later trips refresh fails", async () => {
        vi.spyOn(SyncedTripApi, "list")
            .mockResolvedValueOnce([syncedTrip({ id: "trip-1" })])
            .mockRejectedValueOnce(new Error("The sync request could not be completed."));

        await OnlineTripStore.refresh();
        await expect(OnlineTripStore.refresh()).rejects.toThrow("The sync request could not be completed.");

        expect(OnlineTripStore.getSnapshot().map(trip => trip.id)).toEqual(["trip-1"]);
    });

    it("reports an initial trips refresh failure without inventing state", async () => {
        vi.spyOn(SyncedTripApi, "list").mockRejectedValue(new Error("Unable to load trips."));

        await expect(OnlineTripStore.refresh()).rejects.toThrow("Unable to load trips.");

        expect(OnlineTripStore.getSnapshot()).toEqual([]);
    });

    it("reconstructs the online state from the server on reload", async () => {
        stubServer([syncedTrip({ id: "trip-1" }), syncedTrip({ id: "trip-2", isActive: true })]);
        await OnlineTripStore.refresh();

        OnlineTripStore.applyTrip(toOnlineTrip(syncedTrip({ id: "trip-1", isActive: true })));
        expect(selectActiveTrip(OnlineTripStore.getSnapshot())?.id).toBe("trip-1");

        // A reload re-reads the server state, which is the source of truth.
        OnlineTripStore.reset();
        await OnlineTripStore.refresh();

        expect(selectActiveTrip(OnlineTripStore.getSnapshot())?.id).toBe("trip-2");
    });

    it("reconstructs edited destination and label data from the server on reload", async () => {
        stubServer([syncedTrip({ id: "trip-1", name: "Brno", destination: "Brno" })]);
        await OnlineTripStore.refresh();

        OnlineTripStore.reset();
        stubServer([syncedTrip({ id: "trip-1", name: "Olomouc", destination: "Olomouc", isActive: true })]);
        await OnlineTripStore.refresh();

        const activeTrip = selectActiveTrip(OnlineTripStore.getSnapshot());
        expect(OnlineTripStore.getSnapshot()[0]).toMatchObject({
            destination: "Olomouc",
            name: "Olomouc",
        });
        expect(activeTrip?.destination).toBe("Olomouc");
    });

    it("drops a deleted online trip from the cached state", async () => {
        stubServer([syncedTrip({ id: "trip-1" }), syncedTrip({ id: "trip-2" })]);
        await OnlineTripStore.refresh();

        OnlineTripStore.remove("trip-1");

        expect(OnlineTripStore.getSnapshot().map(trip => trip.id)).toEqual(["trip-2"]);
    });

    it("recovers after a rate limited refresh without losing the cached trips", async () => {
        const rateLimited = new ApiError("Too many trip requests. Please wait a moment and try again.", { status: 429 });
        const list = vi.spyOn(SyncedTripApi, "list")
            .mockResolvedValueOnce([syncedTrip({ id: "trip-1" })])
            .mockRejectedValueOnce(rateLimited)
            .mockResolvedValueOnce([syncedTrip({ id: "trip-1" }), syncedTrip({ id: "trip-2" })]);

        await OnlineTripStore.refresh();
        await expect(OnlineTripStore.refresh()).rejects.toBe(rateLimited);

        // The failed refresh must not empty My Trips.
        expect(OnlineTripStore.getSnapshot().map(trip => trip.id)).toEqual(["trip-1"]);

        await OnlineTripStore.refresh();

        expect(list).toHaveBeenCalledTimes(3);
        expect(OnlineTripStore.getSnapshot().map(trip => trip.id)).toEqual(["trip-1", "trip-2"]);
    });

    it("still applies a newly created trip after a failed refresh", async () => {
        vi.spyOn(SyncedTripApi, "list").mockRejectedValue(new ApiError("The sync request could not be completed (HTTP 500).", { status: 500 }));

        await expect(OnlineTripStore.refresh()).rejects.toThrow("HTTP 500");
        OnlineTripStore.applyTrip(toOnlineTrip(syncedTrip({ id: "trip-created" })));

        expect(OnlineTripStore.getSnapshot().map(trip => trip.id)).toEqual(["trip-created"]);
    });

    it("does not let a slower earlier refresh overwrite a newer result", async () => {
        let resolveSlow: (trips: SyncedTrip[]) => void = () => undefined;
        const slow = new Promise<SyncedTrip[]>(resolve => { resolveSlow = resolve; });
        vi.spyOn(SyncedTripApi, "list")
            .mockReturnValueOnce(slow)
            .mockResolvedValueOnce([syncedTrip({ id: "trip-new" })]);

        const first = OnlineTripStore.refresh();
        await OnlineTripStore.refresh();

        resolveSlow([syncedTrip({ id: "trip-stale" })]);
        await first;

        expect(OnlineTripStore.getSnapshot().map(trip => trip.id)).toEqual(["trip-new"]);
    });

    it("does not empty the cache when a concurrent refresh fails", async () => {
        vi.spyOn(SyncedTripApi, "list")
            .mockResolvedValueOnce([syncedTrip({ id: "trip-1" })]);
        await OnlineTripStore.refresh();

        vi.mocked(SyncedTripApi.list)
            .mockRejectedValueOnce(new ApiError("The sync request could not be completed (HTTP 502).", { status: 502 }))
            .mockRejectedValueOnce(new ApiError("The sync request could not be completed (HTTP 502).", { status: 502 }));

        const results = await Promise.allSettled([
            OnlineTripStore.refresh(),
            OnlineTripStore.refresh(),
        ]);

        expect(results.every(result => result.status === "rejected")).toBe(true);
        expect(OnlineTripStore.getSnapshot().map(trip => trip.id)).toEqual(["trip-1"]);
    });

    it("keeps online state empty for signed out users", async () => {
        vi.stubGlobal("localStorage", {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
        });
        const list = vi.spyOn(SyncedTripApi, "list");

        await OnlineTripStore.refresh();

        expect(list).not.toHaveBeenCalled();
        expect(OnlineTripStore.getSnapshot()).toEqual([]);
    });
});
