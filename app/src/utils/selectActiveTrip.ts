import type { Trip } from "../types";
import {
    ActiveTripSelectionStore,
    findLocallySelectedTrip,
    findOnlineSelectedTrip,
} from "../services/ActiveTripSelection";

/**
 * Picks the single active Trip for the current device. Explicit current-device
 * selection prevents stale local and server active flags from competing.
 */
export function selectActiveTrip(
    trips: Trip[],
    selection = ActiveTripSelectionStore.get(),
): Trip | undefined {
    if (selection?.source === "local") {
        return findLocallySelectedTrip(trips, selection)
            ?? trips.find(trip => trip.source === "online" && trip.status === "active")
            ?? trips.find(trip => trip.status === "active");
    }

    if (selection?.source === "online") {
        return findOnlineSelectedTrip(trips, selection)
            ?? trips.find(trip => trip.source === "online" && trip.status === "active");
    }

    return trips.find(trip => trip.source === "online" && trip.status === "active")
        ?? trips.find(trip => trip.status === "active");
}

/**
 * Checks whether `trip` is the same Trip as the resolved current-device
 * active Trip. Comparing both `id` and `source` avoids treating a local and
 * online Trip that happen to share an id as the same Trip, and avoids
 * relying on the source-specific `status`/`isActive` flags (which stay
 * "active" on their own source even after the device selects a Trip from
 * the other source).
 */
export function isCurrentActiveTrip(
    trip: Pick<Trip, "id" | "source">,
    active: Trip | undefined,
): boolean {
    if (!active) {
        return false;
    }

    // `source` is only ever "online" or absent/"local" for offline Trips, so
    // normalize both sides before comparing instead of relying on strict
    // equality of the raw (possibly undefined) values.
    const normalizedSource = (source: Trip["source"]) => source === "online" ? "online" : "local";

    return active.id === trip.id
        && normalizedSource(active.source) === normalizedSource(trip.source);
}
