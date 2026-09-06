import { apiRequest } from "./client";
import type { ItineraryDay, ItineraryItem } from "../types";

export type SyncedTrip = {
    id: string;
    name: string;
    destination: string;
    country: string;
    startDate: string;
    endDate: string;
    travellers: number;
    status: "planning" | "active" | "finished";
};

export type SyncedItinerary = {
    tripId: string;
    days: ItineraryDay[];
};

type ItineraryItemPayload = Omit<ItineraryItem, "id">;

export type TripMember = {
    userId: string;
    email: string;
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
    itinerary: (tripId: string) =>
        apiRequest<SyncedItinerary>(`/trips/${tripId}/itinerary`),
    createDay: (tripId: string, day: Pick<ItineraryDay, "date" | "title">) =>
        apiRequest<ItineraryDay>(`/trips/${tripId}/itinerary/days`, {
            method: "POST",
            body: JSON.stringify(day),
        }),
    updateDay: (tripId: string, dayId: string, day: Pick<ItineraryDay, "date" | "title">) =>
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
    acceptInvitation: (token: string) =>
        apiRequest(`/invitations/${token}/accept`, { method: "POST" }),
    rejectInvitation: (token: string) =>
        apiRequest(`/invitations/${token}/reject`, { method: "POST" }),
};
