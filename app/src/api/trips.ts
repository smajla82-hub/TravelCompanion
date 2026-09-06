import { apiRequest } from "./client";

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
    acceptInvitation: (token: string) =>
        apiRequest(`/invitations/${token}/accept`, { method: "POST" }),
    rejectInvitation: (token: string) =>
        apiRequest(`/invitations/${token}/reject`, { method: "POST" }),
};
