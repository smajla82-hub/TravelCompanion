import { trips } from "../data/trips";

import type { Trip } from "../types/Trip";

export class TripService {
    static getAll(): Trip[] {
        return trips;
    }

    static getActive(): Trip | undefined {
        return trips.find((trip) => trip.active);
    }
}