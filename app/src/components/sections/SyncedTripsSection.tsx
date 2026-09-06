import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { ApiError } from "../../api/client";
import {
    SyncedTripApi,
    type Invitation,
    type SyncedTrip,
    type TripMember,
} from "../../api/trips";
import { AuthService } from "../../services/AuthService";
import type { ItineraryDay, ItineraryItem } from "../../types";
import {
    Button,
    Card,
    Heading,
    Stack,
} from "../ui";
import { ItineraryDayForm, type ItineraryDayFields } from "../itinerary/ItineraryDayForm";
import { ItineraryItemForm, type ItineraryItemFields } from "../itinerary/ItineraryItemForm";
import { lockConflictMessage } from "./lockConflictMessage";

export function SyncedTripDetail({
    trip,
    onChanged,
}: {
    trip: SyncedTrip;
    onChanged: (trip: SyncedTrip) => void;
}) {
    const [members, setMembers] = useState<TripMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [days, setDays] = useState<ItineraryDay[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [fields, setFields] = useState(() => ({
        name: trip.name || trip.destination,
        destination: trip.destination,
        country: trip.country,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travellers: trip.travellers,
        status: trip.status,
    }));
    const [error, setError] = useState("");
    const ownsLock = useRef(false);
    const currentUser = AuthService.getUser();
    const role = members.find(member => member.userId === currentUser?.id)?.role;
    const canEdit = role === "owner" || role === "editor";
    const isOwner = role === "owner";

    const loadDetails = useCallback(async () => {
        try {
            const loadedMembers = await SyncedTripApi.members(trip.id);
            setMembers(loadedMembers);
            setDays((await SyncedTripApi.itinerary(trip.id)).days);
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
        if (!editMode) return;
        const heartbeat = window.setInterval(() => {
            void SyncedTripApi.heartbeat(trip.id).catch(reason => {
                ownsLock.current = false;
                setError(reason instanceof ApiError ? lockConflictMessage(reason) : "Your edit lock could not be renewed.");
                setEditMode(false);
            });
        }, 45_000);
        return () => {
            window.clearInterval(heartbeat);
            if (ownsLock.current) {
                ownsLock.current = false;
                void SyncedTripApi.releaseLock(trip.id).catch(() => undefined);
            }
        };
    }, [editMode, trip.id]);

    async function beginEdit() {
        setError("");
        try {
            await SyncedTripApi.acquireLock(trip.id);
            ownsLock.current = true;
            setEditMode(true);
        } catch (reason) {
            setError(reason instanceof ApiError ? lockConflictMessage(reason) : "Unable to start editing.");
        }
    }

    async function save() {
        if (!fields.name.trim() || !fields.destination.trim() || !fields.country.trim() ||
            !fields.startDate || !fields.endDate || fields.endDate < fields.startDate ||
            fields.travellers < 1 || fields.name.length > 40) {
            setError("Please provide valid trip details. Name must be 40 characters or fewer.");
            return;
        }
        try {
            const updated = await SyncedTripApi.update(trip.id, { ...trip, ...fields });
            onChanged(updated);
            setEditMode(false);
        } catch (reason) {
            setError(reason instanceof ApiError ? lockConflictMessage(reason) : "Unable to save this trip.");
        }
    }

    async function mutate(action: () => Promise<unknown>) {
        try {
            await action();
            setDays((await SyncedTripApi.itinerary(trip.id)).days);
        } catch (reason) {
            setError(reason instanceof ApiError ? lockConflictMessage(reason) : "Unable to update the itinerary.");
        }
    }

    async function addDay(day: ItineraryDayFields) {
        await mutate(() => SyncedTripApi.createDay(trip.id, day));
    }

    async function updateDay(day: ItineraryDay) {
        await mutate(() => SyncedTripApi.updateDay(trip.id, day.id, day));
    }

    async function addItem(day: ItineraryDay, item: ItineraryItemFields) {
        await mutate(() => SyncedTripApi.createItem(trip.id, day.id, { ...item, date: day.date }));
    }

    async function updateItem(day: ItineraryDay, item: ItineraryItem, updates: ItineraryItemFields) {
        await mutate(() => SyncedTripApi.updateItem(trip.id, day.id, item.id, { ...updates, date: day.date }));
    }

    async function invite(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
            const invitation = await SyncedTripApi.invite(trip.id, String(form.get("email")), String(form.get("role")) as "editor" | "viewer");
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
                    {(["name", "destination", "country"] as const).map(field => (
                        <label key={field}>{field[0].toUpperCase() + field.slice(1)}
                            <input value={fields[field]} onChange={event => setFields(current => ({ ...current, [field]: event.target.value }))} />
                        </label>
                    ))}
                    <label>Start Date<input type="date" value={fields.startDate} onChange={event => setFields(current => ({ ...current, startDate: event.target.value }))} /></label>
                    <label>End Date<input type="date" value={fields.endDate} onChange={event => setFields(current => ({ ...current, endDate: event.target.value }))} /></label>
                    <label>Travellers<input type="number" min={1} value={fields.travellers} onChange={event => setFields(current => ({ ...current, travellers: Number(event.target.value) }))} /></label>
                    <label>Status<select value={fields.status} onChange={event => setFields(current => ({ ...current, status: event.target.value as SyncedTrip["status"] }))}><option value="planning">Planning</option><option value="active">Active</option><option value="finished">Finished</option></select></label>
                    <Button type="button" onClick={() => void save()}>Save synced trip</Button>
                    <Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancel editing</Button>
                </>
            ) : canEdit ? <Button type="button" onClick={() => void beginEdit()}>Edit synced trip</Button> : null}

            <Heading level={2}>Itinerary</Heading>
            {editMode && <ItineraryDayEditor onSubmit={day => void addDay(day)} />}
            {days.map(day => (
                <SyncedDay
                    key={day.id}
                    day={day}
                    editable={editMode}
                    onUpdate={updated => void updateDay(updated)}
                    onDelete={() => void mutate(() => SyncedTripApi.deleteDay(trip.id, day.id))}
                    onAddItem={item => void addItem(day, item)}
                    onUpdateItem={(item, updates) => void updateItem(day, item, updates)}
                    onDeleteItem={itemId => void mutate(() => SyncedTripApi.deleteItem(trip.id, day.id, itemId))}
                />
            ))}

            <Heading level={2}>Members</Heading>
            {members.map(member => <p key={member.userId}>{member.email} — {member.role}</p>)}
            {isOwner && <>
                <Heading level={2}>Invite collaborator</Heading>
                <form onSubmit={invite}><Stack gap="sm"><input name="email" type="email" required placeholder="collaborator@example.com" /><select name="role" defaultValue="editor"><option value="editor">Editor</option><option value="viewer">Viewer</option></select><Button type="submit">Create invitation</Button></Stack></form>
                {invitations.map(invitation => <Card key={invitation.id}><Stack gap="sm"><p>{invitation.email} — {invitation.role} ({invitation.status})</p>{invitation.status === "pending" && <Button type="button" variant="outline" onClick={() => void revoke(invitation)}>Revoke invitation</Button>}</Stack></Card>)}
            </>}
        </Stack>
    );
}

function ItineraryDayEditor({ onSubmit }: { onSubmit: (day: ItineraryDayFields) => void }) {
    return <Card><ItineraryDayForm defaultDate={new Date().toISOString().slice(0, 10)} onSubmit={onSubmit} /></Card>;
}

function SyncedDay({
    day,
    editable,
    onUpdate,
    onDelete,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
}: {
    day: ItineraryDay;
    editable: boolean;
    onUpdate: (day: ItineraryDay) => void;
    onDelete: () => void;
    onAddItem: (item: ItineraryItemFields) => void;
    onUpdateItem: (item: ItineraryItem, updates: ItineraryItemFields) => void;
    onDeleteItem: (id: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    return <Card><Stack gap="sm">
        {editing ? <ItineraryDayForm defaultDate={day.date} onSubmit={value => { onUpdate({ ...day, ...value }); setEditing(false); }} /> : <><h3>{day.date} — {day.title}</h3>{editable && <Stack gap="sm"><Button type="button" onClick={() => setEditing(true)}>Edit day</Button><Button type="button" variant="outline" onClick={onDelete}>Delete day</Button></Stack>}</>}
        {editable && <ItineraryItemForm onSubmit={onAddItem} />}
        {day.items.map(item => <SyncedItem key={item.id} item={item} editable={editable} onUpdate={updates => onUpdateItem(item, updates)} onDelete={() => onDeleteItem(item.id)} />)}
    </Stack></Card>;
}

function SyncedItem({ item, editable, onUpdate, onDelete }: { item: ItineraryItem; editable: boolean; onUpdate: (item: ItineraryItemFields) => void; onDelete: () => void }) {
    const [editing, setEditing] = useState(false);
    return editing ? <ItineraryItemForm item={item} onSubmit={value => { onUpdate(value); setEditing(false); }} /> : <Stack gap="sm"><p>{item.time ? `${item.time} — ` : ""}<strong>{item.title}</strong>{item.location ? ` (${item.location})` : ""}</p>{editable && <Stack gap="sm"><Button type="button" compact onClick={() => setEditing(true)}>Edit activity</Button><Button type="button" compact variant="outline" onClick={onDelete}>Delete activity</Button></Stack>}</Stack>;
}
