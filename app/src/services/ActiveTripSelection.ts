import type { Trip } from "../types";

const STORAGE_KEY = "travel-companion.active-trip-selection";

export type ActiveTripSelection = {
    source: "local" | "online";
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
            if (
                (selection.source === "local" || selection.source === "online")
                && typeof selection.id === "string"
            ) {
                return { source: selection.source, id: selection.id };
            }

            return undefined;
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

    selectOnline(tripId: string) {
        readStorage()?.setItem(STORAGE_KEY, JSON.stringify({
            source: "online",
            id: tripId,
        } satisfies ActiveTripSelection));
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

export function findOnlineSelectedTrip(trips: Trip[], selection = ActiveTripSelectionStore.get()): Trip | undefined {
    if (selection?.source !== "online") {
        return undefined;
    }

    return trips.find(trip => trip.source === "online" && trip.id === selection.id);
}
