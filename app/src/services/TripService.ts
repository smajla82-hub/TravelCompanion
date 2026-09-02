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
        const index = trips.findIndex(
            trip => trip.id === tripId
        );

        if (index === -1) {
            return;
        }

        const trip = trips[index];

        const itinerary = trip.itinerary ?? [];

        const day = itinerary.find(
            item => item.date === date
        );

        const newItem: ItineraryItem = {
            ...item,
            id: `${date}-item-${crypto.randomUUID()}`,
            date,
        };

        const newItinerary = day
            ? itinerary.map(
                current =>
                    current.date === date
                        ? {
                            ...current,
                            items: [
                                ...current.items,
                                newItem,
                            ],
                        }
                        : current
            )
            : [
                ...itinerary,
                {
                    id: date,
                    date,
                    title: "",
                    items: [newItem],
                },
            ];

        trips[index] = {
            ...trip,
            itinerary: newItinerary,
        };

        persistTrips();
    },

    updateItineraryItem(
        tripId: string,
        date: string,
        itemId: string,
        updates: Partial<ItineraryItem>
    ) {
        const index = trips.findIndex(
            trip => trip.id === tripId
        );

        if (index === -1) {
            return;
        }

        const trip = trips[index];

        const day = trip.itinerary?.find(
            item => item.date === date
        );

        const item = day?.items.find(
            item => item.id === itemId
        );

        if (!trip.itinerary || !day || !item) {
            return;
        }

        const newItems = day.items.map(
            current =>
                current.id === itemId
                    ? { ...current, ...updates }
                    : current
        );

        trips[index] = {
            ...trip,
            itinerary: trip.itinerary.map(
                current =>
                    current.id === day.id
                        ? { ...day, items: newItems }
                        : current
            ),
        };

        persistTrips();
    },

    deleteItineraryItem(
        tripId: string,
        date: string,
        itemId: string
    ) {
        const index = trips.findIndex(
            trip => trip.id === tripId
        );

        if (index === -1) {
            return;
        }

        const trip = trips[index];

        const day = trip.itinerary?.find(
            item => item.date === date
        );

        if (!trip.itinerary || !day) {
            return;
        }

        const newItems = day.items.filter(
            item => item.id !== itemId
        );

        if (newItems.length === day.items.length) {
            return;
        }

        trips[index] = {
            ...trip,
            itinerary: trip.itinerary.map(
                current =>
                    current.id === day.id
                        ? { ...day, items: newItems }
                        : current
            ),
        };

        persistTrips();
    },

    reorderItineraryItems(
        tripId: string,
        date: string,
        orderedItemIds: string[]
    ) {
        const index = trips.findIndex(
            trip => trip.id === tripId
        );

        if (index === -1) {
            return;
        }

        const trip = trips[index];

        const day = trip.itinerary?.find(
            item => item.date === date
        );

        if (
            !trip.itinerary ||
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

        trips[index] = {
            ...trip,
            itinerary: trip.itinerary.map(
                current =>
                    current.id === day.id
                        ? { ...day, items: orderedItems }
                        : current
            ),
        };

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