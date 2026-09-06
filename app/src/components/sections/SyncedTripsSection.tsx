import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../../api/client";
import {
    SyncedTripApi,
    type Invitation,
    type SyncedTrip,
    type TripMember,
} from "../../api/trips";
import { AuthService } from "../../services/AuthService";
import { Button, Card, Heading, Modal, Stack } from "../ui";
import { lockConflictMessage } from "./lockConflictMessage";

export function SyncedTripsSection() {
    const [trips, setTrips] = useState<SyncedTrip[]>([]);
    const [error, setError] = useState("");
    const [selectedTrip, setSelectedTrip] = useState<SyncedTrip>();

    const loadTrips = useCallback(async () => {
        setError("");
        try {
            setTrips(await SyncedTripApi.list());
        } catch (reason) {
            setError(reason instanceof ApiError
                ? reason.message
                : "Unable to load synced trips.");
        }
    }, []);

    useEffect(() => {
        queueMicrotask(() => void loadTrips());
    }, [loadTrips]);

    return (
        <>
            <Heading level={2}>Synced & shared trips</Heading>
            <p>These trips are stored in your account, separate from local-only trips.</p>
            {error && <p role="alert">{error}</p>}
            {trips.map(trip => (
                <Card key={trip.id}>
                    <Stack gap="sm">
                        <h3>{trip.name || trip.destination}</h3>
                        <p>{trip.startDate} – {trip.endDate}</p>
                        <Button type="button" onClick={() => setSelectedTrip(trip)}>
                            View synced trip
                        </Button>
                    </Stack>
                </Card>
            ))}
            {!error && trips.length === 0 && <p>No synced trips yet.</p>}
            <Modal
                open={Boolean(selectedTrip)}
                title="Synced Trip"
                onClose={() => setSelectedTrip(undefined)}
            >
                {selectedTrip && (
                    <SyncedTripDetail
                        trip={selectedTrip}
                        onChanged={trip => {
                            setTrips(current => current.map(item =>
                                item.id === trip.id ? trip : item,
                            ));
                        }}
                    />
                )}
            </Modal>
        </>
    );
}

function SyncedTripDetail({
    trip,
    onChanged,
}: {
    trip: SyncedTrip;
    onChanged: (trip: SyncedTrip) => void;
}) {
    const [members, setMembers] = useState<TripMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [destination, setDestination] = useState(trip.destination);
    const [error, setError] = useState("");
    const currentUser = AuthService.getUser();
    const role = members.find(member => member.userId === currentUser?.id)?.role;
    const canEdit = role === "owner" || role === "editor";
    const isOwner = role === "owner";

    const loadDetails = useCallback(async () => {
        try {
            const loadedMembers = await SyncedTripApi.members(trip.id);
            setMembers(loadedMembers);
            if (loadedMembers.some(member =>
                member.userId === currentUser?.id && member.role === "owner",
            )) {
                setInvitations(await SyncedTripApi.invitations(trip.id));
            }
        } catch (reason) {
            setError(reason instanceof ApiError ? reason.message : "Unable to load trip details.");
        }
    }, [currentUser?.id, trip.id]);

    useEffect(() => {
        queueMicrotask(() => void loadDetails());
    }, [loadDetails]);

    useEffect(() => {
        if (!editMode) {
            return;
        }
        const heartbeat = window.setInterval(() => {
            void SyncedTripApi.heartbeat(trip.id).catch(reason => {
                setError(reason instanceof ApiError
                    ? lockConflictMessage(reason)
                    : "Your edit lock could not be renewed.");
                setEditMode(false);
            });
        }, 45_000);
        return () => {
            window.clearInterval(heartbeat);
            void SyncedTripApi.releaseLock(trip.id).catch(() => undefined);
        };
    }, [editMode, trip.id]);

    async function beginEdit() {
        setError("");
        try {
            await SyncedTripApi.acquireLock(trip.id);
            setEditMode(true);
        } catch (reason) {
            setError(reason instanceof ApiError
                ? lockConflictMessage(reason)
                : "Unable to start editing.");
        }
    }

    async function save() {
        try {
            const updated = await SyncedTripApi.update(trip.id, {
                ...trip,
                destination,
            });
            onChanged(updated);
            setEditMode(false);
        } catch (reason) {
            setError(reason instanceof ApiError
                ? lockConflictMessage(reason)
                : "Unable to save this trip.");
        }
    }

    async function invite(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
            const invitation = await SyncedTripApi.invite(
                trip.id,
                String(form.get("email")),
                String(form.get("role")) as "editor" | "viewer",
            );
            setInvitations(current => [invitation, ...current]);
            event.currentTarget.reset();
        } catch (reason) {
            setError(reason instanceof ApiError ? reason.message : "Unable to create invitation.");
        }
    }

    async function revoke(invitation: Invitation) {
        try {
            await SyncedTripApi.revokeInvitation(trip.id, invitation.id);
            await loadDetails();
        } catch (reason) {
            setError(reason instanceof ApiError ? reason.message : "Unable to revoke invitation.");
        }
    }

    return (
        <Stack gap="md">
            <p>{trip.country}</p>
            <p>{trip.startDate} – {trip.endDate}</p>
            <p>{role === "viewer" ? "Read-only access" : `${role ?? "Member"} access`}</p>
            {error && <p role="alert">{error}</p>}
            {editMode ? (
                <>
                    <label>
                        Destination
                        <input value={destination} onChange={event => setDestination(event.target.value)} />
                    </label>
                    <Button type="button" onClick={save}>Save synced trip</Button>
                    <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                        Cancel editing
                    </Button>
                </>
            ) : canEdit ? (
                <Button type="button" onClick={beginEdit}>Edit synced trip</Button>
            ) : null}
            <Heading level={2}>Members</Heading>
            {members.map(member => <p key={member.userId}>{member.email} — {member.role}</p>)}
            {isOwner && (
                <>
                    <Heading level={2}>Invite collaborator</Heading>
                    <form onSubmit={invite}>
                        <Stack gap="sm">
                            <input name="email" type="email" required placeholder="collaborator@example.com" />
                            <select name="role" defaultValue="editor">
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <Button type="submit">Create invitation</Button>
                        </Stack>
                    </form>
                    {invitations.map(invitation => (
                        <Card key={invitation.id}>
                            <Stack gap="sm">
                                <p>{invitation.email} — {invitation.role} ({invitation.status})</p>
                                {invitation.status === "pending" && (
                                    <>
                                        <label>
                                            Share this link
                                            <input
                                                readOnly
                                                value={`${window.location.origin}${import.meta.env.BASE_URL}accept-invite/${invitation.token}`}
                                            />
                                        </label>
                                        <Button type="button" variant="outline" onClick={() => revoke(invitation)}>
                                            Revoke invitation
                                        </Button>
                                    </>
                                )}
                            </Stack>
                        </Card>
                    ))}
                </>
            )}
        </Stack>
    );
}
