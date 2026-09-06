import { useEffect, useSyncExternalStore } from "react";
import { TripService } from "../services/TripService";
import { OnlineTripStore } from "../services/OnlineTripStore";
import { AuthService } from "../services/AuthService";
import { selectActiveTrip } from "../utils/selectActiveTrip";
import type { Trip } from "../types";

export function useTrips() {
    const trips = TripService.getAll();
    const onlineTrips = useSyncExternalStore(
        OnlineTripStore.subscribe,
        OnlineTripStore.getSnapshot,
        OnlineTripStore.getSnapshot,
    );

    useEffect(() => {
        if (!AuthService.getToken()) return;
        void OnlineTripStore.ensureLoaded().catch(() => undefined);
    }, []);

    const allTrips: Trip[] = [...trips, ...onlineTrips];
    const activeTrip = selectActiveTrip(allTrips);

    return {
        trips: allTrips,
        onlineTrips,
        activeTrip,
    };
}
