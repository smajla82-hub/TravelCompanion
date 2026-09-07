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
        const selectedOnlineTrip = findOnlineSelectedTrip(trips, selection);
        const activeOnlineTrip = trips.find(trip => trip.source === "online" && trip.status === "active");

        if (!selectedOnlineTrip) {
            return activeOnlineTrip;
        }

        return selectedOnlineTrip.status === "active"
            ? selectedOnlineTrip
            : activeOnlineTrip;
    }

    return trips.find(trip => trip.source === "online" && trip.status === "active")
        ?? trips.find(trip => trip.status === "active");
}
