import { afterEach, describe, expect, it, vi } from "vitest";

// TripService reads localStorage while it is imported (via OnlineTripStore ->
// TripAdapter -> TripService), so a stub has to exist before the modules
// under test are loaded.
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

import { SyncedTripApi } from "../api/trips";
import { OnlineTripStore } from "../services/OnlineTripStore";
import { respondToInvitation } from "./respondToInvitation";

describe("respondToInvitation", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("accepts an invitation exactly once and refreshes the online Trips cache", async () => {
        const accept = vi.spyOn(SyncedTripApi, "acceptInvitation").mockResolvedValue(undefined);
        const reject = vi.spyOn(SyncedTripApi, "rejectInvitation").mockResolvedValue(undefined);
        const refresh = vi.spyOn(OnlineTripStore, "refresh").mockResolvedValue([]);

        await respondToInvitation("accept", "token-123");

        expect(accept).toHaveBeenCalledTimes(1);
        expect(accept).toHaveBeenCalledWith("token-123");
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(reject).not.toHaveBeenCalled();
    });

    it("rejects an invitation exactly once without refreshing the online Trips cache", async () => {
        const accept = vi.spyOn(SyncedTripApi, "acceptInvitation").mockResolvedValue(undefined);
        const reject = vi.spyOn(SyncedTripApi, "rejectInvitation").mockResolvedValue(undefined);
        const refresh = vi.spyOn(OnlineTripStore, "refresh").mockResolvedValue([]);

        await respondToInvitation("reject", "token-456");

        expect(reject).toHaveBeenCalledTimes(1);
        expect(reject).toHaveBeenCalledWith("token-456");
        expect(accept).not.toHaveBeenCalled();
        expect(refresh).not.toHaveBeenCalled();
    });

    it("does not refresh the online Trips cache when acceptance fails", async () => {
        vi.spyOn(SyncedTripApi, "acceptInvitation").mockRejectedValue(new Error("Invitation not found."));
        const refresh = vi.spyOn(OnlineTripStore, "refresh").mockResolvedValue([]);

        await expect(respondToInvitation("accept", "token-789")).rejects.toThrow("Invitation not found.");

        expect(refresh).not.toHaveBeenCalled();
    });
});
