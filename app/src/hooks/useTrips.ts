import { useEffect, useState } from "react";
import { TripService } from "../services/TripService";
import { SyncedTripApi } from "../api/trips";
import type { Trip } from "../types";
import { createTripAdapter } from "../services/TripAdapter";

export function useTrips() {
    const trips = TripService.getAll();
    const [onlineTrips, setOnlineTrips] = useState<Trip[]>([]);

    useEffect(() => {
        if (!localStorage.getItem("travel-companion.auth-token")) return;
        void SyncedTripApi.list().then(async list => {
            const loaded = await Promise.all(list.map(item => createTripAdapter(item).getTrip()));
            setOnlineTrips(loaded);
        }).catch(() => setOnlineTrips([]));
    }, []);

    const allTrips = [...trips, ...onlineTrips];
    const activeTrip = allTrips.find(trip => trip.source === "online" && trip.status === "active")
        ?? allTrips.find(trip => trip.status === "active");

    return {
        trips: allTrips,
        activeTrip,
    };
}