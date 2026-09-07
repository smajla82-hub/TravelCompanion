import { SyncedTripApi } from "../api/trips";
import { AuthService } from "./AuthService";
import { toOnlineTrip } from "./TripAdapter";
import type { Trip } from "../types";

/**
 * Single client-side source of truth for server backed (online) Trips.
 *
 * Online Trips stay server backed: the store only caches what the server
 * returned so that React views can react to mutations without a page reload.
 */

let onlineTrips: Trip[] = [];
let loading: Promise<Trip[]> | undefined;
const listeners = new Set<() => void>();

function publish(next: Trip[]) {
    onlineTrips = next;
    for (const listener of listeners) {
        listener();
    }
}

function withSingleActive(trips: Trip[], activeTripId: string): Trip[] {
    return trips.map(trip => {
        if (trip.id === activeTripId) {
            return { ...trip, status: "active" as const };
        }

        // A previously active Trip is demoted so only one Trip stays active.
        if (trip.status === "active") {
            return { ...trip, status: "planning" as const };
        }

        return trip;
    });
}

async function loadFromServer(): Promise<Trip[]> {
    const list = await SyncedTripApi.list();
    return list.map(toOnlineTrip);
}

export const OnlineTripStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    getSnapshot(): Trip[] {
        return onlineTrips;
    },

    /** Reloads the online Trips from the server list endpoint. */
    async refresh(): Promise<Trip[]> {
        if (!AuthService.getToken()) {
            publish([]);
            return [];
        }

        const request = loadFromServer().then(loaded => {
            // A slower earlier refresh must never overwrite the result of a
            // newer one, so only the latest in-flight request publishes.
            if (loading === request) {
                publish(loaded);
            }

            return loaded;
        });
        loading = request;

        try {
            return await request;
        } finally {
            // Only the latest request clears the in-flight marker, so a slower
            // earlier load cannot discard it.
            if (loading === request) {
                loading = undefined;
            }
        }
    },

    /** Loads the online Trips once, reusing an in-flight load when present. */
    async ensureLoaded(): Promise<Trip[]> {
        if (loading) {
            return loading;
        }

        return OnlineTripStore.refresh();
    },

    /**
     * Applies a Trip returned by the server (create, update or set active) to
     * the cached state so the UI updates immediately.
     */
    applyTrip(trip: Trip) {
        const known = onlineTrips.find(item => item.id === trip.id);
        const merged: Trip = {
            ...trip,
            source: "online",
            itinerary: trip.itinerary?.length ? trip.itinerary : known?.itinerary ?? [],
            itineraryLoaded: trip.itineraryLoaded ?? known?.itineraryLoaded ?? false,
        };

        const next = known
            ? onlineTrips.map(item => item.id === trip.id ? merged : item)
            : [...onlineTrips, merged];

        publish(merged.status === "active" ? withSingleActive(next, merged.id) : next);
    },

    remove(tripId: string) {
        publish(onlineTrips.filter(trip => trip.id !== tripId));
    },

    /** Test helper: clears cached online state. */
    reset() {
        loading = undefined;
        publish([]);
    },
};
