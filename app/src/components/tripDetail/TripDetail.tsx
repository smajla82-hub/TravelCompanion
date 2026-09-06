import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import { AuthService } from "../../services/AuthService";
import { createTripAdapter } from "../../services/TripAdapter";
import type { Invitation, TripMember } from "../../api/trips";
import type { ItineraryDay, Trip } from "../../types";
import { Button, Card, Heading, Stack } from "../ui";
import { ItineraryDayDetail } from "../itinerary";
import { ItineraryDayModal } from "../itinerary";
import type { ItineraryDayFields } from "../itinerary/ItineraryDayForm";
import { lockConflictMessage } from "../sections/lockConflictMessage";

export function TripDetail({
    trip,
    onEdit,
    onDelete,
    onSetActive,
    onChanged,
}: {
    trip: Trip;
    onEdit?: () => void;
    onDelete?: () => void;
    onSetActive?: () => void;
    onChanged?: (trip: Trip) => void;
}) {
    const adapter = useMemo(() => createTripAdapter(trip), [trip]);
    const [days, setDays] = useState<ItineraryDay[]>(trip.itinerary ?? []);
    const [members, setMembers] = useState<TripMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [editing, setEditing] = useState(false);
    const [dayModalOpen, setDayModalOpen] = useState(false);
    const [fields, setFields] = useState(() => ({
        name: trip.name ?? trip.destination,
        destination: trip.destination,
        country: trip.country,
        startDate: trip.startDate.slice(0, 10),
        endDate: trip.endDate.slice(0, 10),
        travellers: trip.travellers,
        status: trip.status,
    }));
    const [error, setError] = useState("");
    const lock = useRef(false);
    const user = AuthService.getUser();
    const role = members.find(member => member.userId === user?.id)?.role;
    const canEdit = adapter.source === "local" || role === "owner" || role === "editor";

    useEffect(() => {
        if (adapter.source !== "online") return;
        void Promise.all([adapter.getTrip(), adapter.members()])
            .then(([loaded, loadedMembers]) => {
                setDays(loaded.itinerary ?? []);
                setMembers(loadedMembers);
                if (loadedMembers.some(member => member.userId === user?.id && member.role === "owner")) {
                    return adapter.invitations().then(setInvitations);
                }
            })
            .catch(reason => setError(reason instanceof ApiError ? reason.message : "Unable to load trip details."));
    }, [trip.id, adapter, user?.id]);

    useEffect(() => {
        if (!editing || adapter.source !== "online") return;
        const heartbeat = window.setInterval(() => {
            void adapter.heartbeat().catch(reason => {
                lock.current = false;
                setEditing(false);
                setError(reason instanceof ApiError ? lockConflictMessage(reason) : "Your edit lock could not be renewed.");
            });
        }, 45_000);
        return () => {
            window.clearInterval(heartbeat);
            if (lock.current) {
                lock.current = false;
                void adapter.releaseLock().catch(() => undefined);
            }
        };
    }, [editing, adapter]);

    async function beginEdit() {
        try {
            await adapter.acquireLock();
            lock.current = adapter.source === "online";
            setEditing(true);
        } catch (reason) {
            setError(reason instanceof ApiError ? lockConflictMessage(reason) : "Unable to start editing.");
        }

    }

    async function saveTrip() {
        if (!fields.name.trim() || !fields.destination.trim() || !fields.country.trim() ||
            !fields.startDate || !fields.endDate || fields.endDate < fields.startDate ||
            fields.travellers < 1) {
            setError("Please provide valid trip details.");
            return;
        }
        try {
            const updated = await adapter.updateTrip({ ...trip, ...fields });
            setEditing(false);
            onChanged?.(updated);
        } catch (reason) {
            setError(reason instanceof ApiError ? lockConflictMessage(reason) : "Unable to save this trip.");
        }
    }

    async function refresh() {
        const loaded = await adapter.getTrip();
        setDays(loaded.itinerary ?? []);
        onChanged?.(loaded);
    }

    async function invite(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
            const invitation = await adapter.invite(String(form.get("email")), String(form.get("role")) as "editor" | "viewer");
            setInvitations(current => [invitation, ...current]);
            event.currentTarget.reset();
        } catch (reason) {
            setError(reason instanceof ApiError ? reason.message : "Unable to create invitation.");
        }

    }

    async function revoke(invitationId: string) {
        try {
            await adapter.revokeInvitation(invitationId);
            setInvitations(current => current.filter(item => item.id !== invitationId));
        } catch (reason) {
            setError(reason instanceof ApiError ? lockConflictMessage(reason) : "Unable to revoke invitation.");
        }
    }

    return (
        <Stack gap="md">
            <Heading level={2}>{trip.name ?? trip.destination}</Heading>
            <p>{trip.country}</p>
            <p>{trip.startDate} – {trip.endDate}</p>
            <p>{adapter.source === "online" ? `${role ?? "Member"} access` : "Offline trip"}</p>
            {error && <p role="alert">{error}</p>}
            <Stack gap="sm">
                {trip.status !== "active" && <Button type="button" onClick={onSetActive}>Set as Active Trip</Button>}
                {adapter.source === "online" && canEdit && !editing && <Button type="button" onClick={() => void beginEdit()}>Edit Trip</Button>}
                {adapter.source === "local" && onEdit && <Button type="button" onClick={onEdit}>Edit Trip</Button>}
                {onDelete && <Button type="button" onClick={onDelete}>Delete Trip</Button>}
            </Stack>
            {editing && <Card><Stack gap="sm">
                {(["name", "destination", "country"] as const).map(field => (
                    <label key={field}>{field[0].toUpperCase() + field.slice(1)}
                        <input value={fields[field]} onChange={event => setFields(current => ({ ...current, [field]: event.target.value }))} />
                    </label>
                ))}
                <label>Start Date<input type="date" value={fields.startDate} onChange={event => setFields(current => ({ ...current, startDate: event.target.value }))} /></label>
                <label>End Date<input type="date" value={fields.endDate} onChange={event => setFields(current => ({ ...current, endDate: event.target.value }))} /></label>
                <label>Travellers<input type="number" min={1} value={fields.travellers} onChange={event => setFields(current => ({ ...current, travellers: Number(event.target.value) }))} /></label>
                <label>Status<select value={fields.status} onChange={event => setFields(current => ({ ...current, status: event.target.value as Trip["status"] }))}><option value="planning">Planning</option><option value="active">Active</option><option value="finished">Finished</option></select></label>
                <Button type="button" onClick={() => void saveTrip()}>Save Trip</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </Stack></Card>}
            <Heading level={2}>Itinerary</Heading>
            {editing && <Button type="button" onClick={() => setDayModalOpen(true)}>Add Day</Button>}
            {days.map(day => (
                <ItineraryDayDetail
                    key={day.id}
                    day={day}
                    adapter={adapter}
                    editable={adapter.source === "local" || editing}
                    onClose={() => undefined}
                    onDayChanged={() => void refresh()}
                />
            ))}
            {editing && <ItineraryDayModal
                open={dayModalOpen}
                defaultDate={new Date().toISOString().slice(0, 10)}
                onClose={() => setDayModalOpen(false)}
                onSubmit={(day: ItineraryDayFields) => {
                    void adapter.addDay(day).then(() => {
                        setDayModalOpen(false);
                        return refresh();
                    }).catch(reason => setError(reason instanceof ApiError ? lockConflictMessage(reason) : "Unable to add day."));
                }}
            />}
            {adapter.source === "online" && <>
                <Heading level={2}>Members</Heading>
                {members.map(member => <p key={member.userId}>{member.email} — {member.role}</p>)}
                {role === "owner" && <><Heading level={2}>Invite collaborator</Heading>
                    <form onSubmit={invite}><Stack gap="sm"><input name="email" type="email" required placeholder="collaborator@example.com" /><select name="role" defaultValue="editor"><option value="editor">Editor</option><option value="viewer">Viewer</option></select><Button type="submit">Create invitation</Button></Stack></form>
                    {invitations.map(invitation => <Card key={invitation.id}><Stack gap="sm"><p>{invitation.email} — {invitation.role} ({invitation.status})</p>{invitation.status === "pending" && <Button type="button" variant="outline" onClick={() => void revoke(invitation.id)}>Revoke invitation</Button>}</Stack></Card>)}
                </>}
            </>}
        </Stack>
    );
}
