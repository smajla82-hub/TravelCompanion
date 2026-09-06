import type { Trip } from "../types";

/**
 * Picks the single active Trip for the current user. Online (server backed)
 * Trips win over local ones so that the server remains the source of truth for
 * the online active state.
 */
export function selectActiveTrip(trips: Trip[]): Trip | undefined {
    return trips.find(trip => trip.source === "online" && trip.status === "active")
        ?? trips.find(trip => trip.status === "active");
}
