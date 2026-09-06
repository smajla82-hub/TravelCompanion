import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setAuthToken } from "./client";
import { SyncedTripApi } from "./trips";

describe("SyncedTripApi itinerary operations", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
        });
        setAuthToken("test-token");
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates itinerary days and items through the lock-protected endpoints", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ id: "day-1" })))
            .mockResolvedValueOnce(new Response(JSON.stringify({ id: "item-1" })));
        vi.stubGlobal("fetch", fetchMock);

        await SyncedTripApi.createDay("trip-1", { date: "2026-09-07", title: "Arrival" });
        await SyncedTripApi.createItem("trip-1", "day-1", {
            date: "2026-09-07",
            title: "Check in",
        });

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining("/trips/trip-1/itinerary/days"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ date: "2026-09-07", title: "Arrival" }),
            }),
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining("/trips/trip-1/itinerary/days/day-1/items"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    date: "2026-09-07",
                    title: "Check in",
                }),
            }),
        );
    });

    it("uses the same trip lock endpoints for itinerary import workflows", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({})))
            .mockResolvedValueOnce(new Response(JSON.stringify({})))
            .mockResolvedValueOnce(new Response(JSON.stringify({ released: true })));
        vi.stubGlobal("fetch", fetchMock);

        await SyncedTripApi.acquireLock("trip-1");
        await SyncedTripApi.deleteDay("trip-1", "day-1");
        await SyncedTripApi.releaseLock("trip-1");

        expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
            expect.stringContaining("/trips/trip-1/lock"),
            expect.stringContaining("/trips/trip-1/itinerary/days/day-1"),
            expect.stringContaining("/trips/trip-1/lock"),
        ]);
        expect(fetchMock.mock.calls.map(call => call[1]?.method)).toEqual([
            "POST",
            "DELETE",
            "DELETE",
        ]);
    });
});
