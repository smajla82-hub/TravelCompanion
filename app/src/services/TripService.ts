import { trips } from "../data/trips";

import type {
    ItineraryDay,
    ItineraryItem,
    ParkingLocation,
    RecommendedVenue,
    Trip,
} from "../types";
import { normalizeActivityType } from
    "../domain/activity/ActivityTypeRegistry";
import { sortItineraryDays } from
    "./itinerary/sortItineraryDays";
import { sortItineraryItems } from
    "./itinerary/sortItineraryItems";
import {
    canAddVenue,
    canAddParkingLocation,
    isValidParkingCode,
    isDuplicateParkingCode,
} from
    "../domain/itinerary/venueParkingLimits";

const STORAGE_KEY =
    "travel-companion.trips";

type ImportBackupResult = {
    success: boolean;
    error?: string;
};

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

    exportBackup(): string {
        return JSON.stringify(
            {
                version: 1,
                exportedAt: new Date().toISOString(),
                trips: this.getAll(),
            },
            null,
            2
        );
    },

    importBackup(json: string): ImportBackupResult {
        let parsed: {
            trips?: unknown;
        };

        try {
            parsed =
                JSON.parse(json);
        } catch {
            return {
                success: false,
                error: "Invalid backup file.",
            };
        }

        if (!Array.isArray(parsed.trips)) {
            return {
                success: false,
                error: "Invalid backup file.",
            };
        }

        trips.splice(
            0,
            trips.length,
            ...parsed.trips as Trip[]
        );

        persistTrips();

        return {
            success: true,
        };
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

    addItineraryDay(
        tripId: string,
        day: Pick<ItineraryDay, "date" | "title">
    ): ItineraryDay | undefined {
        const index = trips.findIndex(
            trip => trip.id === tripId
        );

        if (index === -1) {
            return undefined;
        }

        const trip = trips[index];
        const itinerary = trip.itinerary ?? [];
        const existingDay = itinerary.find(
            item => item.date === day.date
        );

        if (existingDay) {
            return existingDay;
        }

        const newDay: ItineraryDay = {
            id: `day-${day.date}`,
            date: day.date,
            title: day.title,
            items: [],
        };

        trips[index] = {
            ...trip,
            itinerary: sortItineraryDays([
                ...itinerary,
                newDay,
            ]),
        };

        persistTrips();

        return newDay;
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
            activityType: normalizeActivityType(item.activityType),
        };

        const newItinerary = day
            ? itinerary.map(
                current =>
                    current.date === date
                        ? {
                            ...current,
                            items: sortItineraryItems([
                                ...current.items,
                                newItem,
                            ]),
                        }
                        : current
            )
            : [
                ...itinerary,
                {
                    id: `day-${date}`,
                    date,
                    title: "",
                    items: sortItineraryItems([newItem]),
                },
            ];

        trips[index] = {
            ...trip,
            itinerary: sortItineraryDays(newItinerary),
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

        const newItems = sortItineraryItems(day.items.map(
            current =>
                current.id === itemId
                    ? {
                        ...current,
                        ...updates,
                        activityType: normalizeActivityType(
                            updates.activityType ?? current.activityType
                        ),
                    }
                    : current
        ));

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

    addVenue(
        tripId: string,
        date: string,
        venue: Omit<RecommendedVenue, "id">
    ): RecommendedVenue | undefined {
        const index = trips.findIndex(
            trip => trip.id === tripId
        );

        if (index === -1) {
            return undefined;
        }

        const trip = trips[index];
        const day = trip.itinerary?.find(
            item => item.date === date
        );

        if (!trip.itinerary || !day) {
            return undefined;
        }

        const existingVenues = day.venues ?? [];

        if (!canAddVenue(existingVenues.length)) {
            throw new Error(
                "This day already has the maximum of 6 recommended venues."
            );
        }

        const newVenue: RecommendedVenue = {
            ...venue,
            id: `${date}-venue-${crypto.randomUUID()}`,
        };

        trips[index] = {
            ...trip,
            itinerary: trip.itinerary.map(
                current =>
                    current.id === day.id
                        ? {
                            ...day,
                            venues: [...existingVenues, newVenue],
                        }
                        : current
            ),
        };

        persistTrips();

        return newVenue;
    },

    updateVenue(
        tripId: string,
        date: string,
        venueId: string,
        updates: Partial<RecommendedVenue>
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

        const newVenues = (day.venues ?? []).map(
            current =>
                current.id === venueId
                    ? { ...current, ...updates }
                    : current
        );

        trips[index] = {
            ...trip,
            itinerary: trip.itinerary.map(
                current =>
                    current.id === day.id
                        ? { ...day, venues: newVenues }
                        : current
            ),
        };

        persistTrips();
    },

    deleteVenue(
        tripId: string,
        date: string,
        venueId: string
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

        const newVenues = (day.venues ?? []).filter(
            venue => venue.id !== venueId
        );

        trips[index] = {
            ...trip,
            itinerary: trip.itinerary.map(
                current =>
                    current.id === day.id
                        ? { ...day, venues: newVenues }
                        : current
            ),
        };

        persistTrips();
    },

    addParkingLocation(
        tripId: string,
        date: string,
        parking: Omit<ParkingLocation, "id">
    ): ParkingLocation | undefined {
        const index = trips.findIndex(
            trip => trip.id === tripId
        );

        if (index === -1) {
            return undefined;
        }

        const trip = trips[index];
        const day = trip.itinerary?.find(
            item => item.date === date
        );

        if (!trip.itinerary || !day) {
            return undefined;
        }

        const existingParking = day.parkingLocations ?? [];

        if (!isValidParkingCode(parking.code)) {
            throw new Error(
                "Parking code must be one of P1-P8."
            );
        }

        if (
            isDuplicateParkingCode(
                existingParking.map(location => location.code),
                parking.code
            )
        ) {
            throw new Error(
                `Parking code ${parking.code} is already used on this day.`
            );
        }

        if (!canAddParkingLocation(existingParking.length)) {
            throw new Error(
                "This day already has the maximum of 8 parking locations."
            );
        }

        const newParking: ParkingLocation = {
            ...parking,
            id: `${date}-parking-${crypto.randomUUID()}`,
        };

        trips[index] = {
            ...trip,
            itinerary: trip.itinerary.map(
                current =>
                    current.id === day.id
                        ? {
                            ...day,
                            parkingLocations: [
                                ...existingParking,
                                newParking,
                            ],
                        }
                        : current
            ),
        };

        persistTrips();

        return newParking;
    },

    updateParkingLocation(
        tripId: string,
        date: string,
        parkingId: string,
        updates: Partial<ParkingLocation>
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

        const existing = day?.parkingLocations?.find(
            location => location.id === parkingId
        );

        if (!trip.itinerary || !day || !existing) {
            return;
        }

        // The parking `code` is read-only after creation: changing it would
        // require rewriting every `ItineraryItem.parking` reference for the
        // day, which this feature intentionally does not support (FP-2
        // decision). Any `code` in `updates` is ignored.
        const newParkingLocations = (day.parkingLocations ?? []).map(
            current =>
                current.id === parkingId
                    ? { ...current, ...updates, code: current.code }
                    : current
        );

        trips[index] = {
            ...trip,
            itinerary: trip.itinerary.map(
                current =>
                    current.id === day.id
                        ? { ...day, parkingLocations: newParkingLocations }
                        : current
            ),
        };

        persistTrips();
    },

    /**
     * Deletes a parking location. When `clearReferences` is not set and the
     * code is still referenced by an activity in the same day, the deletion
     * is rejected instead of silently orphaning `ItineraryItem.parking`
     * values. When `clearReferences` is set, the parking location is removed
     * and every referencing activity's `parking` field is cleared in the
     * same update.
     */
    deleteParkingLocation(
        tripId: string,
        date: string,
        parkingId: string,
        options: { clearReferences?: boolean } = {}
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

        const existing = day?.parkingLocations?.find(
            location => location.id === parkingId
        );

        if (!trip.itinerary || !day || !existing) {
            return;
        }

        const referencingItems = day.items.filter(
            item => item.parking === existing.code
        );

        if (referencingItems.length > 0 && !options.clearReferences) {
            throw new Error(
                `Parking ${existing.code} is referenced by ${referencingItems.length} ` +
                "activity/activities. Remove or reassign them before deleting, " +
                "or delete and clear references."
            );
        }

        const newParkingLocations = (day.parkingLocations ?? []).filter(
            location => location.id !== parkingId
        );

        const newItems = options.clearReferences
            ? day.items.map(item =>
                item.parking === existing.code
                    ? { ...item, parking: undefined }
                    : item
            )
            : day.items;

        trips[index] = {
            ...trip,
            itinerary: trip.itinerary.map(
                current =>
                    current.id === day.id
                        ? {
                            ...day,
                            parkingLocations: newParkingLocations,
                            items: newItems,
                        }
                        : current
            ),
        };

        persistTrips();
    },

};