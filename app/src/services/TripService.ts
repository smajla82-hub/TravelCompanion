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

    update(trip: Trip) {
        const index = trips.findIndex(
            item => item.id === trip.id
        );

        if (index === -1) {
            return;
        }

        trips[index] = trip;
    },

    delete(id: string) {
        const index = trips.findIndex(
            trip => trip.id === id
        );

        if (index === -1) {
            return;
        }

        trips.splice(index, 1);
    },

    setActive(id: string) {
        const trip = trips.find(
            item => item.id === id
        );

        if (!trip) {
            return;
        }

        trips.forEach(item => {
            item.status =
                item.id === id
                    ? "active"
                    : "planning";
        });
    },

};