import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../api/client";
import { AuthService } from "../../services/AuthService";
import { createTripAdapter } from "../../services/TripAdapter";
import { useTrips } from "../../hooks";
import { isCurrentActiveTrip } from "../../utils/selectActiveTrip";
import { buildInviteShareLink } from "../../utils/invitationLink";
import type { Invitation, TripMember } from "../../api/trips";
import type { Trip } from "../../types";
import { Button, Card, Heading, Stack } from "../ui";
import { lockConflictMessage } from "../sections/lockConflictMessage";

export function TripDetail({
    trip,
    onEdit,
    onDelete,
    onSetActive,
}: {
    trip: Trip;
    onEdit?: () => void;
    onDelete?: () => void;
    onSetActive?: () => void;
}) {
    const adapter = useMemo(() => createTripAdapter(trip), [trip]);
    const [members, setMembers] = useState<TripMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [error, setError] = useState("");
    const user = AuthService.getUser();
    const role = members.find(member => member.userId === user?.id)?.role;
    const canEdit = adapter.source === "local" || role === "owner" || role === "editor";

    // The explicit current-device selection (not the source-specific
    // `status`/`isActive` flag) determines whether this Trip is already the
    // active one. Relying on `status` here made the button disappear
    // permanently once a Trip had ever been active on its own source, even
    // after the device switched its active selection away from it.
    const { activeTrip } = useTrips();
    const isCurrentSelection = isCurrentActiveTrip(trip, activeTrip);

    useEffect(() => {
        if (adapter.source !== "online") return;
        void adapter.members()
            .then(loadedMembers => {
                setMembers(loadedMembers);
                if (loadedMembers.some(member => member.userId === user?.id && member.role === "owner")) {
                    return adapter.invitations().then(setInvitations);
                }
            })
            .catch(reason => setError(reason instanceof ApiError ? reason.message : "Unable to load trip details."));
    }, [trip.id, adapter, user?.id]);

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
            <p>Start date: {trip.startDate}</p>
            <p>End date: {trip.endDate}</p>
            <p>Travellers: {trip.travellers}</p>
            <p>{adapter.source === "online" ? `${role ?? "Member"} access` : "Offline trip"}</p>
            {error && <p role="alert">{error}</p>}
            <Stack gap="sm">
                {!isCurrentSelection && <Button type="button" onClick={onSetActive}>Set as Active Trip</Button>}
                {canEdit && onEdit && <Button type="button" onClick={onEdit}>Edit Trip</Button>}
                {(adapter.source === "local" || role === "owner") && onDelete && <Button type="button" onClick={onDelete}>Delete Trip</Button>}
            </Stack>
            {adapter.source === "online" && <>
                <Heading level={2}>Members</Heading>
                {members.map(member => <p key={member.userId}>{member.email} — {member.role}</p>)}
                {role === "owner" && <><Heading level={2}>Invite collaborator</Heading>
                    <form onSubmit={invite}><Stack gap="sm"><input name="email" type="email" required placeholder="collaborator@example.com" /><select name="role" defaultValue="editor"><option value="editor">Editor</option><option value="viewer">Viewer</option></select><Button type="submit">Create invitation</Button></Stack></form>
                    {invitations.map(invitation => <Card key={invitation.id}><Stack gap="sm"><p>{invitation.email} — {invitation.role} ({invitation.status})</p>{invitation.status === "pending" && invitation.acceptLink && <p>Invite link: <code>{buildInviteShareLink(window.location.origin, invitation.acceptLink)}</code></p>}{invitation.status === "pending" && <Button type="button" variant="outline" onClick={() => void revoke(invitation.id)}>Revoke invitation</Button>}</Stack></Card>)}
                </>}
            </>}
        </Stack>
    );
}
