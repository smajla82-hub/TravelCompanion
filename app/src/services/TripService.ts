import { trips } from "../data/trips";

import type {
    ItineraryDay,
    ItineraryItem,
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

    addItineraryItem(
        tripId: string,
        date: string,
        item: Omit<ItineraryItem, "id">
    ) {
        const trip = trips.find(
            item => item.id === tripId
        );

        if (!trip) {
            return;
        }

        const itinerary = trip.itinerary ?? [];
        let day = itinerary.find(
            item => item.date === date
        );

        if (!day) {
            day = {
                id: date,
                date,
                title: "",
                items: [],
            };

            itinerary.push(day);
            trip.itinerary = itinerary;
        }

        day.items.push({
            ...item,
            id: `${date}-item-${crypto.randomUUID()}`,
            date,
        });

        persistTrips();
    },

    updateItineraryItem(
        tripId: string,
        date: string,
        itemId: string,
        updates: Partial<ItineraryItem>
    ) {
        const trip = trips.find(
            item => item.id === tripId
        );

        const day = trip?.itinerary?.find(
            item => item.date === date
        );

        const item = day?.items.find(
            item => item.id === itemId
        );

        if (!item) {
            return;
        }

        Object.assign(item, updates);

        persistTrips();
    },

    deleteItineraryItem(
        tripId: string,
        date: string,
        itemId: string
    ) {
        const trip = trips.find(
            item => item.id === tripId
        );

        const day = trip?.itinerary?.find(
            item => item.date === date
        );

        if (!day) {
            return;
        }

        const index = day.items.findIndex(
            item => item.id === itemId
        );

        if (index === -1) {
            return;
        }

        day.items.splice(index, 1);

        persistTrips();
    },

    reorderItineraryItems(
        tripId: string,
        date: string,
        orderedItemIds: string[]
    ) {
        const trip = trips.find(
            item => item.id === tripId
        );

        const day = trip?.itinerary?.find(
            item => item.date === date
        );

        if (
            !day ||
            orderedItemIds.length !== day.items.length ||
            new Set(orderedItemIds).size !== orderedItemIds.length
        ) {
            return;
        }

        const orderedItems: ItineraryItem[] = [];

        for (const itemId of orderedItemIds) {
            const item = day.items.find(
                item => item.id === itemId
            );

            if (!item) {
                return;
            }

            orderedItems.push(item);
        }

        day.items = orderedItems;

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