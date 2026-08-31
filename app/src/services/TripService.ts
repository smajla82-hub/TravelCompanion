import { trips } from "../data/trips";

import type {
    ItineraryDay,
    Trip,
} from "../types";

const STORAGE_KEY =
    "travel-companion.trips";

function loadTrips() {
    const stored =
        localStorage.getItem(STORAGE_KEY);

    if (!stored) {
        return;
    }

    try {
        const parsed: Trip[] =
            JSON.parse(stored);

        trips.splice(
            0,
            trips.length,
            ...parsed
        );
    } catch {
        console.warn(
            "Unable to load trips from localStorage."
        );
    }
}

function persistTrips() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(trips)
    );
}

loadTrips();

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
        persistTrips();
    },

    update(trip: Trip) {
        const index = trips.findIndex(
            item => item.id === trip.id
        );

        if (index === -1) {
            return;
        }

        trips[index] = trip;
        persistTrips();
    },

    setItinerary(
        id: string,
        itinerary: ItineraryDay[]
    ) {
        const trip = trips.find(
            item => item.id === id
        );

        if (!trip) {
            return;
        }

        trip.itinerary = itinerary;

        persistTrips();
    },

    delete(id: string) {
        const index = trips.findIndex(
            trip => trip.id === id
        );

        if (index === -1) {
            return;
        }

        trips.splice(index, 1);
        persistTrips();
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

        persistTrips();
    },

};