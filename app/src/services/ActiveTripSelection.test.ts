import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActiveTripSelectionStore } from "./ActiveTripSelection";

describe("ActiveTripSelectionStore", () => {
    let storage: Map<string, string>;

    beforeEach(() => {
        storage = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("persists an explicit offline active selection on this device", () => {
        ActiveTripSelectionStore.selectLocal("local-1");

        expect(ActiveTripSelectionStore.get()).toEqual({
            source: "local",
            id: "local-1",
        });
    });

    it("clears the offline override when an online trip is explicitly selected", () => {
        ActiveTripSelectionStore.selectLocal("local-1");

        ActiveTripSelectionStore.selectOnline();

        expect(ActiveTripSelectionStore.get()).toBeUndefined();
    });
});
