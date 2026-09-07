import type { Trip } from "../types";

const STORAGE_KEY = "travel-companion.active-trip-selection";

type ActiveTripSelection = {
    source: "local";
    id: string;
};

function readStorage(): Storage | undefined {
    return typeof localStorage === "undefined" ? undefined : localStorage;
}

export const ActiveTripSelectionStore = {
    get(): ActiveTripSelection | undefined {
        const stored = readStorage()?.getItem(STORAGE_KEY);
        if (!stored) {
            return undefined;
        }

        try {
            const selection = JSON.parse(stored) as Partial<ActiveTripSelection>;
            return selection.source === "local" && typeof selection.id === "string"
                ? { source: "local", id: selection.id }
                : undefined;
        } catch {
            return undefined;
        }
    },

    selectLocal(tripId: string) {
        readStorage()?.setItem(STORAGE_KEY, JSON.stringify({
            source: "local",
            id: tripId,
        } satisfies ActiveTripSelection));
    },

    selectOnline() {
        readStorage()?.removeItem(STORAGE_KEY);
    },

    clear() {
        readStorage()?.removeItem(STORAGE_KEY);
    },
};

export function findLocallySelectedTrip(trips: Trip[], selection = ActiveTripSelectionStore.get()): Trip | undefined {
    if (selection?.source !== "local") {
        return undefined;
    }

    return trips.find(trip => trip.source !== "online" && trip.id === selection.id);
}
