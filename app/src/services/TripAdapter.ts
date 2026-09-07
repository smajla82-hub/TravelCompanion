import type { ItineraryDay, ItineraryItem, Trip } from "../types";
import { TripService } from "./TripService";
import {
    SyncedTripApi,
    type Invitation,
    type SyncedTrip,
    type TripMember,
} from "../api/trips";
import { ActiveTripSelectionStore } from "./ActiveTripSelection";

export type TripSource = "local" | "online";
export type TripAdapter = {
    source: TripSource;
    getTrip: () => Promise<Trip>;
    setItinerary: (days: ItineraryDay[]) => Promise<void>;
    addDay: (day: Pick<ItineraryDay, "date" | "title">) => Promise<ItineraryDay | undefined>;
    updateDay: (day: ItineraryDay) => Promise<void>;
    deleteDay: (dayId: string) => Promise<void>;
    addItem: (day: ItineraryDay, item: Omit<ItineraryItem, "id" | "date">) => Promise<void>;
    updateItem: (day: ItineraryDay, itemId: string, updates: Partial<ItineraryItem>) => Promise<void>;
    deleteItem: (day: ItineraryDay, itemId: string) => Promise<void>;
    reorderItems: (day: ItineraryDay, ids: string[]) => Promise<void>;
    acquireLock: () => Promise<void>;
    heartbeat: () => Promise<void>;
    releaseLock: () => Promise<void>;
    members: () => Promise<TripMember[]>;
    invitations: () => Promise<Invitation[]>;
    invite: (email: string, role: "editor" | "viewer") => Promise<Invitation>;
    revokeInvitation: (id: string) => Promise<void>;
    updateTrip: (trip: Trip) => Promise<Trip>;
    setActive: () => Promise<Trip>;
};

function localAdapter(tripId: string): TripAdapter {
    const get = () => TripService.getAll().find(trip => trip.id === tripId);
    return {
        source: "local",
        getTrip: async () => get() ?? Promise.reject(new Error("Trip not found.")),
        setItinerary: async days => TripService.setItinerary(tripId, days),
        addDay: async day => TripService.addItineraryDay(tripId, day),
        updateDay: async day => {
            const trip = get();
            if (trip) TripService.setItinerary(tripId, (trip.itinerary ?? []).map(current => current.id === day.id ? day : current));
        },
        deleteDay: async dayId => {
            const trip = get();
            if (trip) TripService.setItinerary(tripId, (trip.itinerary ?? []).filter(day => day.id !== dayId));
        },
        addItem: async (day, item) => TripService.addItineraryItem(tripId, day.date, { ...item, date: day.date }),
        updateItem: async (day, itemId, updates) => TripService.updateItineraryItem(tripId, day.date, itemId, updates),
        deleteItem: async (day, itemId) => TripService.deleteItineraryItem(tripId, day.date, itemId),
        reorderItems: async (day, ids) => TripService.reorderItineraryItems(tripId, day.date, ids),
        acquireLock: async () => undefined,
        heartbeat: async () => undefined,
        releaseLock: async () => undefined,
        members: async () => [],
        invitations: async () => [],
        invite: async () => Promise.reject(new Error("Invitations are only available online.")),
        revokeInvitation: async () => undefined,
        updateTrip: async trip => { TripService.update(trip); return trip; },
        setActive: async () => {
            TripService.setActive(tripId);
            ActiveTripSelectionStore.selectLocal(tripId);
            return get() ?? Promise.reject(new Error("Trip not found."));
        },
    };
}

/**
 * Resolves the client Trip status: the server tracks the active Trip with the
 * `isActive` flag, so it wins over the stored `status`.
 */
function onlineTripStatus(trip: SyncedTrip): Trip["status"] {
    if (trip.isActive === undefined) {
        return trip.status;
    }

    if (trip.isActive) {
        return "active";
    }

    return trip.status === "active" ? "planning" : trip.status;
}

/** Maps a server Trip to the client Trip representation. */
export function toOnlineTrip(trip: SyncedTrip): Trip {
    return {
        id: trip.id,
        destination: trip.destination,
        country: trip.country,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travellers: trip.travellers,
        status: onlineTripStatus(trip),
        itinerary: [],
        source: "online",
        name: trip.name,
    };
}

export function createTripAdapter(trip: Pick<Trip, "id" | "source"> | SyncedTrip): TripAdapter {
    if ("source" in trip
        ? trip.source !== "online"
        : !("name" in trip)) {
        return localAdapter(trip.id);
    }
    const tripId = trip.id;
    let lockHeld = false;
    const get = async () => toOnlineTrip(await SyncedTripApi.get(tripId));
    const reload = async () => (await SyncedTripApi.itinerary(tripId)).days;
    async function acquire() {
        if (!lockHeld) {
            await SyncedTripApi.acquireLock(tripId);
            lockHeld = true;
        }
    }
    async function release() {
        if (lockHeld) {
            lockHeld = false;
            await SyncedTripApi.releaseLock(tripId);
        }
    }
    async function withLock<T>(mutation: () => Promise<T>) {
        const ownedHere = !lockHeld;
        if (ownedHere) await acquire();
        try {
            return await mutation();
        } finally {
            if (ownedHere) await release();
        }
    }
    return {
        source: "online",
        getTrip: async () => ({ ...(await get()), itinerary: await reload(), itineraryLoaded: true }),
        setItinerary: days => withLock(async () => {
            const existing = await reload();
            for (const day of existing) await SyncedTripApi.deleteDay(tripId, day.id);
            for (const day of days) {
                const created = await SyncedTripApi.createDay(tripId, { date: day.date, title: day.title });
                for (const item of day.items) {
                    const payload = { ...item };
                    delete (payload as { id?: string }).id;
                    await SyncedTripApi.createItem(tripId, created.id, payload);
                }
            }
        }),
        addDay: day => withLock(() => SyncedTripApi.createDay(tripId, day)),
        updateDay: day => withLock(async () => { await SyncedTripApi.updateDay(tripId, day.id, day); }),
        deleteDay: dayId => withLock(async () => { await SyncedTripApi.deleteDay(tripId, dayId); }),
        addItem: (day, item) => withLock(async () => { await SyncedTripApi.createItem(tripId, day.id, { ...item, date: day.date }); }),
        updateItem: (day, itemId, updates) => withLock(async () => { await SyncedTripApi.updateItem(tripId, day.id, itemId, { ...updates, date: day.date }); }),
        deleteItem: (day, itemId) => withLock(async () => { await SyncedTripApi.deleteItem(tripId, day.id, itemId); }),
        reorderItems: (day, ids) => withLock(async () => {
            await Promise.all(ids.map((id, sortOrder) =>
                SyncedTripApi.updateItem(tripId, day.id, id, { sortOrder } as Partial<ItineraryItem>),
            ));
        }),
        acquireLock: acquire,
        heartbeat: async () => { await SyncedTripApi.heartbeat(tripId); },
        releaseLock: release,
        members: () => SyncedTripApi.members(tripId),
        invitations: () => SyncedTripApi.invitations(tripId),
        invite: (email, role) => SyncedTripApi.invite(tripId, email, role),
        revokeInvitation: async id => { await SyncedTripApi.revokeInvitation(tripId, id); },
        updateTrip: updated => withLock(async () => toOnlineTrip(await SyncedTripApi.update(tripId, {
            ...updated,
            name: updated.destination ?? updated.name,
        } as SyncedTrip))),
        setActive: () => withLock(async () => {
            const activeTrip = toOnlineTrip(await SyncedTripApi.setActive(tripId));
            ActiveTripSelectionStore.selectOnline();
            return activeTrip;
        }),
    };
}
