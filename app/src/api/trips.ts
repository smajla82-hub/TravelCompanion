import { apiRequest } from "./client";
import type { ItineraryDay, ItineraryItem, ParkingLocation, RecommendedVenue } from "../types";

export type SyncedTrip = {
    id: string;
    name: string;
    destination: string;
    country: string;
    startDate: string;
    endDate: string;
    travellers: number;
    status: "planning" | "active" | "finished";
    isActive?: boolean;
};

export type SyncedItinerary = {
    tripId: string;
    days: ItineraryDay[];
};

type ItineraryItemPayload = Omit<ItineraryItem, "id">;

export type ItineraryDayPayload = Pick<ItineraryDay, "date" | "title"> & {
    items: ItineraryItemPayload[];
    venues?: ItineraryDay["venues"];
    stats?: ItineraryDay["stats"];
    parkingLocations?: ItineraryDay["parkingLocations"];
};

export type TripMember = {
    userId: string;
    email: string;
    displayName?: string | null;
    role: "owner" | "editor" | "viewer";
};

export type Invitation = {
    id: string;
    email: string;
    role: "editor" | "viewer";
    status: string;
    token: string;
    acceptLink?: string;
};

export type LockConflict = {
    lockedBy?: {
        email: string;
        displayName?: string | null;
    };
};

export const SyncedTripApi = {
    list: () => apiRequest<SyncedTrip[]>("/trips"),
    get: (tripId: string) => apiRequest<SyncedTrip>(`/trips/${tripId}`),
    create: (trip: Omit<SyncedTrip, "id">) =>
        apiRequest<SyncedTrip>("/trips", { method: "POST", body: JSON.stringify(trip) }),
    setActive: (tripId: string) =>
        apiRequest<SyncedTrip>(`/trips/${tripId}/active`, { method: "PUT" }),
    members: (tripId: string) =>
        apiRequest<TripMember[]>(`/trips/${tripId}/members`),
    invitations: (tripId: string) =>
        apiRequest<Invitation[]>(`/trips/${tripId}/invitations`),
    invite: (tripId: string, email: string, role: "editor" | "viewer") =>
        apiRequest<Invitation>(`/trips/${tripId}/invitations`, {
            method: "POST",
            body: JSON.stringify({ email, role }),
        }),
    revokeInvitation: (tripId: string, invitationId: string) =>
        apiRequest<Invitation>(
            `/trips/${tripId}/invitations/${invitationId}`,
            { method: "DELETE" },
        ),
    acquireLock: (tripId: string) =>
        apiRequest(`/trips/${tripId}/lock`, { method: "POST" }),
    heartbeat: (tripId: string) =>
        apiRequest(`/trips/${tripId}/lock/heartbeat`, { method: "PUT" }),
    releaseLock: (tripId: string) =>
        apiRequest(`/trips/${tripId}/lock`, { method: "DELETE" }),
    update: (tripId: string, trip: SyncedTrip) =>
        apiRequest<SyncedTrip>(`/trips/${tripId}`, {
            method: "PUT",
            body: JSON.stringify(trip),
        }),
    delete: (tripId: string) =>
        apiRequest(`/trips/${tripId}`, { method: "DELETE" }),
    itinerary: (tripId: string) =>
        apiRequest<SyncedItinerary>(`/trips/${tripId}/itinerary`),
    /** Replaces the whole itinerary of a Trip in one atomic server request. */
    replaceItinerary: (tripId: string, days: ItineraryDayPayload[]) =>
        apiRequest<SyncedItinerary>(`/trips/${tripId}/itinerary`, {
            method: "PUT",
            body: JSON.stringify({ days }),
        }),
    createDay: (tripId: string, day: Pick<ItineraryDay, "date" | "title">) =>
        apiRequest<ItineraryDay>(`/trips/${tripId}/itinerary/days`, {
            method: "POST",
            body: JSON.stringify(day),
        }),
    updateDay: (tripId: string, dayId: string, day: Pick<ItineraryDay, "date" | "title"> & Pick<ItineraryDay, "stats">) =>
        apiRequest<ItineraryDay>(`/trips/${tripId}/itinerary/days/${dayId}`, {
            method: "PUT",
            body: JSON.stringify(day),
        }),
    deleteDay: (tripId: string, dayId: string) =>
        apiRequest(`/trips/${tripId}/itinerary/days/${dayId}`, { method: "DELETE" }),
    createItem: (tripId: string, dayId: string, item: ItineraryItemPayload) =>
        apiRequest<ItineraryItem>(`/trips/${tripId}/itinerary/days/${dayId}/items`, {
            method: "POST",
            body: JSON.stringify(item),
        }),
    updateItem: (
        tripId: string,
        dayId: string,
        itemId: string,
        item: Partial<ItineraryItemPayload>,
    ) =>
        apiRequest<ItineraryItem>(
            `/trips/${tripId}/itinerary/days/${dayId}/items/${itemId}`,
            { method: "PUT", body: JSON.stringify(item) },
        ),
    deleteItem: (tripId: string, dayId: string, itemId: string) =>
        apiRequest(`/trips/${tripId}/itinerary/days/${dayId}/items/${itemId}`, {
            method: "DELETE",
        }),
    createVenue: (tripId: string, dayId: string, venue: Omit<RecommendedVenue, "id">) =>
        apiRequest<RecommendedVenue>(`/trips/${tripId}/itinerary/days/${dayId}/venues`, {
            method: "POST",
            body: JSON.stringify(venue),
        }),
    updateVenue: (
        tripId: string,
        dayId: string,
        venueId: string,
        venue: Partial<RecommendedVenue>,
    ) =>
        apiRequest<RecommendedVenue>(
            `/trips/${tripId}/itinerary/days/${dayId}/venues/${venueId}`,
            { method: "PUT", body: JSON.stringify(venue) },
        ),
    deleteVenue: (tripId: string, dayId: string, venueId: string) =>
        apiRequest(`/trips/${tripId}/itinerary/days/${dayId}/venues/${venueId}`, {
            method: "DELETE",
        }),
    createParking: (tripId: string, dayId: string, parking: Omit<ParkingLocation, "id">) =>
        apiRequest<ParkingLocation>(`/trips/${tripId}/itinerary/days/${dayId}/parking`, {
            method: "POST",
            body: JSON.stringify(parking),
        }),
    updateParking: (
        tripId: string,
        dayId: string,
        parkingId: string,
        parking: Partial<ParkingLocation>,
    ) =>
        apiRequest<ParkingLocation>(
            `/trips/${tripId}/itinerary/days/${dayId}/parking/${parkingId}`,
            { method: "PUT", body: JSON.stringify(parking) },
        ),
    deleteParking: (
        tripId: string,
        dayId: string,
        parkingId: string,
    ) =>
        apiRequest(
            `/trips/${tripId}/itinerary/days/${dayId}/parking/${parkingId}`,
            { method: "DELETE" },
        ),
    acceptInvitation: (token: string) =>
        apiRequest(`/invitations/${token}/accept`, { method: "POST" }),
    rejectInvitation: (token: string) =>
        apiRequest(`/invitations/${token}/reject`, { method: "POST" }),
};
