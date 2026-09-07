import type { Trip } from "../types";

/**
 * Offline Trips keep their itinerary in memory/local storage, so it is
 * always available synchronously. Online Trips fetch their itinerary from
 * the server asynchronously (see `ItinerarySection`'s loading effect and
 * `OnlineTripStore.applyItinerary`/`applyTrip`), so `itineraryLoaded` is the
 * only reliable signal that the fetch has completed.
 *
 * Both Continue Trip's scroll gating and the itinerary section's own
 * rendering must treat an Online Trip as "not ready" until this is true, or
 * they risk observing/showing an empty itinerary as if it were final (the
 * "Today's itinerary is not available" false intermediate state).
 */
export function isItineraryReady(
    trip: Pick<Trip, "source" | "itineraryLoaded"> | undefined
): boolean {
    if (!trip) {
        return false;
    }

    return trip.source !== "online" || Boolean(trip.itineraryLoaded);
}
