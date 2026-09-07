import type { Trip } from "../types";
import { ActiveTripSelectionStore, findLocallySelectedTrip } from "../services/ActiveTripSelection";

/**
 * Picks the single active Trip for the current device. An explicit local Trip
 * selection wins on that device until the user explicitly selects an Online Trip.
 */
export function selectActiveTrip(
    trips: Trip[],
    selection = ActiveTripSelectionStore.get(),
): Trip | undefined {
    return findLocallySelectedTrip(trips, selection)
        ?? trips.find(trip => trip.source === "online" && trip.status === "active")
        ?? trips.find(trip => trip.status === "active");
}
