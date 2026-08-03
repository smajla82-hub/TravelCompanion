import { trips } from "../data/trips";

import type { Trip } from "../types";

export const TripService = {

    getAll(): Trip[] {
        return trips;
    },

    getActive(): Trip | undefined {
        return trips.find(
            trip => trip.status === "active"
        );
    },

    add(trip: Trip) {
        trips.push(trip);
    },

};