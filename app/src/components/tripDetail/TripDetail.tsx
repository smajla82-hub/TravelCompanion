import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../api/client";
import { AuthService } from "../../services/AuthService";
import { createTripAdapter } from "../../services/TripAdapter";
import { useTrips } from "../../hooks";
import { isCurrentActiveTrip } from "../../utils/selectActiveTrip";
import { buildInviteShareLink } from "../../utils/invitationLink";
import type { Invitation, TripMember } from "../../api/trips";
import type { Trip } from "../../types";
import { Button, Card, Icon, Modal, Stack } from "../ui";
import { lockConflictMessage } from "../sections/lockConflictMessage";
import "./TripDetail.css";

type TripDetailProps = {
    trip: Trip;
    onEdit?: () => void;
    onDelete?: () => void;
    onSetActive?: () => void;
    initialMembers?: TripMember[];
    initialInvitations?: Invitation[];
    initialHistoryOpen?: boolean;
};

type Feedback = {
    tone: "success" | "error";
    message: string;
};

const MEMBER_ROLE_STYLES: Record<TripMember["role"], string> = {
    owner: "trip-detail__role trip-detail__role--owner",
    editor: "trip-detail__role trip-detail__role--editor",
    viewer: "trip-detail__role trip-detail__role--viewer",
};

function roleLabel(role?: TripMember["role"]) {
    if (!role) return "Member";
    return role.toUpperCase();
}

function invitationStatusLabel(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function invitationStatusDate(invitation: Invitation) {
    if (invitation.status === "pending") return invitation.createdAt;
    return invitation.updatedAt;
}

function formatDateTime(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export function TripDetail({
    trip,
    onEdit,
    onDelete,
    onSetActive,
    initialMembers = [],
    initialInvitations = [],
    initialHistoryOpen = false,
}: TripDetailProps) {
    const adapter = useMemo(() => createTripAdapter(trip), [trip]);
    const [members, setMembers] = useState<TripMember[]>(initialMembers);
    const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [copiedInvitationId, setCopiedInvitationId] = useState<string | null>(null);
    const [historyOpen, setHistoryOpen] = useState(initialHistoryOpen);
    const [pendingAction, setPendingAction] = useState<"link" | "email" | null>(null);
    const [emailSendingInvitationId, setEmailSendingInvitationId] = useState<string | null>(null);

    const user = AuthService.getUser();
    const role = members.find(member => member.userId === user?.id)?.role;
    const canEdit = adapter.source === "local" || role === "owner" || role === "editor";
    const isOwner = role === "owner";

    const { activeTrip } = useTrips();
    const isCurrentSelection = isCurrentActiveTrip(trip, activeTrip);
    const currentInvitations = invitations.filter(invitation => invitation.status === "pending");

    useEffect(() => {
        if (adapter.source !== "online") return;
        void adapter.members()
            .then(async loadedMembers => {
                setMembers(loadedMembers);
                if (loadedMembers.some(member => member.userId === user?.id && member.role === "owner")) {
                    setInvitations(await adapter.invitations());
                }
            })
            .catch(reason => setFeedback({
                tone: "error",
                message: reason instanceof ApiError ? reason.message : "Unable to load trip details.",
            }));
    }, [trip.id, adapter, user?.id]);

    async function invite(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFeedback(null);
        setCopiedInvitationId(null);

        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const delivery = submitter?.value === "email" ? "email" : "link";
        setPendingAction(delivery);

        const form = new FormData(event.currentTarget);
        try {
            const invitation = await adapter.invite(
                String(form.get("email") ?? ""),
                String(form.get("role") ?? "editor") as "editor" | "viewer",
            );
            setInvitations(current => [invitation, ...current]);

            if (delivery === "email") {
                await adapter.sendInvitationEmail(invitation.id);
                setFeedback({ tone: "success", message: "Invitation email sent." });
            } else {
                setFeedback({ tone: "success", message: "Invitation link created." });
            }
            event.currentTarget.reset();
        } catch (reason) {
            setFeedback({
                tone: "error",
                message: reason instanceof ApiError
                    ? reason.message
                    : "Unable to create invitation.",
            });
        } finally {
            setPendingAction(null);
        }
    }

    async function sendInvitationEmail(invitationId: string) {
        setFeedback(null);
        setEmailSendingInvitationId(invitationId);
        try {
            await adapter.sendInvitationEmail(invitationId);
            setFeedback({ tone: "success", message: "Invitation email sent." });
        } catch (reason) {
            setFeedback({
                tone: "error",
                message: reason instanceof ApiError
                    ? reason.message
                    : "Unable to send invitation email.",
            });
        } finally {
            setEmailSendingInvitationId(null);
        }
    }

    async function revoke(invitationId: string) {
        setFeedback(null);
        try {
            await adapter.revokeInvitation(invitationId);
            setInvitations(current => current.map(item => (
                item.id === invitationId
                    ? { ...item, status: "revoked", updatedAt: new Date().toISOString() }
                    : item
            )));
        } catch (reason) {
            setFeedback({
                tone: "error",
                message: reason instanceof ApiError
                    ? lockConflictMessage(reason)
                    : "Unable to revoke invitation.",
            });
        }
    }

    async function copyInviteLink(invitationId: string, link: string) {
        setFeedback(null);
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard API unavailable.");
            }
            await navigator.clipboard.writeText(link);
            setCopiedInvitationId(invitationId);
            setFeedback({ tone: "success", message: "Invitation link copied." });
        } catch {
            setFeedback({ tone: "error", message: "Unable to copy the invite link. Please copy it manually." });
        }
    }

    return (
        <>
            <Stack gap="md" className="trip-detail">
                <header className="trip-detail__header">
                    <h2>{trip.name ?? trip.destination}</h2>
                    <p>{adapter.source === "online" ? `${roleLabel(role)} access` : "Offline trip"}</p>
                </header>

                <section className="trip-detail__metadata" aria-label="Trip metadata">
                    <p>
                        <Icon name="mapPin" width={18} height={18} />
                        <span>{trip.country || "Country not set"}</span>
                    </p>
                    <p>
                        <Icon name="calendarDays" width={18} height={18} />
                        <span>{trip.startDate} — {trip.endDate}</span>
                    </p>
                    <p>
                        <Icon name="usersRound" width={18} height={18} />
                        <span>{trip.travellers} traveller{trip.travellers === 1 ? "" : "s"}</span>
                    </p>
                </section>

                {feedback && (
                    <p
                        className={`trip-detail__feedback trip-detail__feedback--${feedback.tone}`}
                        role="status"
                        aria-live="polite"
                    >
                        <Icon name={feedback.tone === "success" ? "circleCheck" : "circleAlert"} width={16} height={16} />
                        {feedback.message}
                    </p>
                )}

                <section className="trip-detail__actions" aria-label="Trip actions">
                    {!isCurrentSelection && (
                        <Button type="button" variant="outline" onClick={onSetActive} className="trip-detail__action trip-detail__action--active">
                            <Icon name="star" width={16} height={16} />
                            Set as Active Trip
                        </Button>
                    )}
                    {canEdit && onEdit && (
                        <Button type="button" variant="outline" onClick={onEdit} className="trip-detail__action trip-detail__action--edit">
                            <Icon name="pencil" width={16} height={16} />
                            Edit Trip
                        </Button>
                    )}
                    {(adapter.source === "local" || isOwner) && onDelete && (
                        <Button type="button" variant="outline" onClick={onDelete} className="trip-detail__action trip-detail__action--delete">
                            <Icon name="trash" width={16} height={16} />
                            Delete Trip
                        </Button>
                    )}
                </section>

                {adapter.source === "online" && (
                    <>
                        <section className="trip-detail__members" aria-label="Trip members">
                            <h3>Members</h3>
                            {members.map(member => (
                                <Card key={member.userId} variant="outlined" className="trip-detail__member-row">
                                    <p className="trip-detail__member-name">{member.displayName || member.email}</p>
                                    {member.displayName && <p className="trip-detail__member-email">{member.email}</p>}
                                    <span className={MEMBER_ROLE_STYLES[member.role]}>
                                        {roleLabel(member.role)}
                                    </span>
                                </Card>
                            ))}
                        </section>

                        {isOwner && (
                            <section className="trip-detail__invites" aria-label="Collaborator invitations">
                                <h3>Invite collaborator</h3>
                                <form onSubmit={invite} className="trip-detail__invite-form">
                                    <label htmlFor="trip-detail-invite-email">Email</label>
                                    <input id="trip-detail-invite-email" name="email" type="email" required placeholder="collaborator@example.com" />

                                    <label htmlFor="trip-detail-invite-role">Role</label>
                                    <select id="trip-detail-invite-role" name="role" defaultValue="editor">
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>

                                    <div className="trip-detail__invite-actions">
                                        <Button type="submit" value="link" disabled={pendingAction !== null} className="trip-detail__action trip-detail__action--edit">
                                            Create invitation link
                                        </Button>
                                        <Button type="submit" value="email" disabled={pendingAction !== null} className="trip-detail__action trip-detail__action--active">
                                            Send invitation email
                                        </Button>
                                    </div>
                                </form>

                                <div className="trip-detail__current-invitations">
                                    <h4>Current invitations</h4>
                                    {currentInvitations.length === 0 && <p>No pending invitations.</p>}
                                    {currentInvitations.map(invitation => {
                                        const origin = typeof window === "undefined"
                                            ? "https://travel-companion.local"
                                            : window.location.origin;
                                        const inviteLink = invitation.acceptLink
                                            ? buildInviteShareLink(origin, invitation.acceptLink)
                                            : undefined;

                                        return (
                                            <Card key={invitation.id} variant="outlined" className="trip-detail__invitation-card">
                                                <p><strong>{invitation.email}</strong></p>
                                                <p>{roleLabel(invitation.role)}</p>
                                                {inviteLink && (
                                                    <p className="trip-detail__invite-link">
                                                        <code>{inviteLink}</code>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            compact
                                                            onClick={() => void copyInviteLink(invitation.id, inviteLink)}
                                                        >
                                                            Copy link
                                                        </Button>
                                                    </p>
                                                )}
                                                <div className="trip-detail__invite-actions">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        compact
                                                        onClick={() => void sendInvitationEmail(invitation.id)}
                                                        disabled={emailSendingInvitationId === invitation.id}
                                                        className="trip-detail__action trip-detail__action--edit"
                                                    >
                                                        Send invitation email
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        compact
                                                        onClick={() => void revoke(invitation.id)}
                                                        className="trip-detail__action trip-detail__action--delete"
                                                    >
                                                        Revoke invitation
                                                    </Button>
                                                </div>
                                                {copiedInvitationId === invitation.id && (
                                                    <p className="trip-detail__subtle-status" role="status">Copied.</p>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>

                                <Button type="button" variant="outline" onClick={() => setHistoryOpen(true)}>
                                    Invitation History ({invitations.length})
                                </Button>
                            </section>
                        )}
                    </>
                )}
            </Stack>

            <Modal
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                title="Invitation History"
            >
                <div className="trip-detail__history" aria-label="Invitation history list">
                    {invitations.length === 0 && <p>No invitation history.</p>}
                    {invitations.map(invitation => (
                        <Card key={invitation.id} variant="outlined" className="trip-detail__history-item">
                            <p><strong>{invitationStatusLabel(invitation.status)}</strong></p>
                            <p>{invitation.email}</p>
                            <p>{roleLabel(invitation.role)}</p>
                            <p>Created: {formatDateTime(invitation.createdAt)}</p>
                            <p>Status date: {formatDateTime(invitationStatusDate(invitation))}</p>
                        </Card>
                    ))}
                </div>
            </Modal>
        </>
    );
}
