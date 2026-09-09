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
import { SETTINGS_BACKGROUND_URL } from "../../styles/brandAssets";
import { runInviteTopAction } from "./inviteTopAction";
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

export const TRIP_DETAIL_HEADER_BACKGROUND_IMAGE = `linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.75) 100%), url("${SETTINGS_BACKGROUND_URL}")`;

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

function dedupeInvitations(items: Invitation[]) {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
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
    const [invitations, setInvitations] = useState<Invitation[]>(dedupeInvitations(initialInvitations));
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [inviteFeedback, setInviteFeedback] = useState<Feedback | null>(null);
    const [invitationActionFeedback, setInvitationActionFeedback] = useState<{
        invitationId: string;
        tone: "success" | "error";
        message: string;
    } | null>(null);
    const [invitationListFeedback, setInvitationListFeedback] = useState<Feedback | null>(null);
    const [historyOpen, setHistoryOpen] = useState(initialHistoryOpen);
    const [creatingInvitation, setCreatingInvitation] = useState(false);
    const [emailSendingInvitationId, setEmailSendingInvitationId] = useState<string | null>(null);

    const user = AuthService.getUser();
    const role = members.find(member => member.userId === user?.id)?.role;
    const canEdit = adapter.source === "local" || role === "owner" || role === "editor";
    const isOwner = role === "owner";

    const { activeTrip } = useTrips();
    const isCurrentSelection = isCurrentActiveTrip(trip, activeTrip);
    const currentInvitations = dedupeInvitations(
        invitations.filter(invitation => invitation.status === "pending"),
    );
    const historicalInvitations = invitations.filter(invitation => invitation.status !== "pending");

    useEffect(() => {
        if (adapter.source !== "online") return;
        void adapter.members()
            .then(async loadedMembers => {
                setMembers(loadedMembers);
                if (loadedMembers.some(member => member.userId === user?.id && member.role === "owner")) {
                    setInvitations(dedupeInvitations(await adapter.invitations()));
                }
            })
            .catch(reason => setFeedback({
                tone: "error",
                message: reason instanceof ApiError ? reason.message : "Unable to load trip details.",
            }));
    }, [trip.id, adapter, user?.id]);

    async function reconcileInvitations() {
        setInvitations(dedupeInvitations(await adapter.invitations()));
    }

    async function invite(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (creatingInvitation) return;
        setInviteFeedback(null);
        setInvitationListFeedback(null);
        setInvitationActionFeedback(null);
        setCreatingInvitation(true);

        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") ?? "");
        try {
            const result = await runInviteTopAction({
                createInvitation: () => adapter.invite(
                    email,
                    String(form.get("role") ?? "editor") as "editor" | "viewer",
                ),
                listInvitations: () => adapter.invitations(),
                currentInvitations: invitations,
                email,
            });
            setInvitations(result.invitations);
            setInviteFeedback(result.feedback);
        } finally {
            setCreatingInvitation(false);
        }
    }

    async function sendInvitationEmail(invitationId: string) {
        setInviteFeedback(null);
        setInvitationListFeedback(null);
        setInvitationActionFeedback(null);
        setEmailSendingInvitationId(invitationId);
        try {
            await adapter.sendInvitationEmail(invitationId);
            await reconcileInvitations();
            setInvitationActionFeedback({
                invitationId,
                tone: "success",
                message: "Invitation email sent.",
            });
        } catch (reason) {
            setInvitationActionFeedback({
                invitationId,
                tone: "error",
                message: reason instanceof ApiError
                    ? reason.message
                    : "Unable to deliver invitation email.",
            });
        } finally {
            setEmailSendingInvitationId(null);
        }
    }

    async function revoke(invitationId: string) {
        setFeedback(null);
        setInviteFeedback(null);
        setInvitationActionFeedback(null);
        setInvitationListFeedback(null);
        try {
            await adapter.revokeInvitation(invitationId);
            await reconcileInvitations();
            setInvitationListFeedback({ tone: "success", message: "Invitation revoked." });
        } catch (reason) {
            setInvitationListFeedback({
                tone: "error",
                message: reason instanceof ApiError
                    ? lockConflictMessage(reason)
                    : "Unable to revoke invitation.",
            });
        }
    }

    async function copyInviteLink(invitationId: string, link: string) {
        setInviteFeedback(null);
        setInvitationListFeedback(null);
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard API unavailable.");
            }
            await navigator.clipboard.writeText(link);
            setInvitationActionFeedback({
                invitationId,
                tone: "success",
                message: "Invitation link copied.",
            });
        } catch {
            setInvitationActionFeedback({
                invitationId,
                tone: "error",
                message: "Unable to copy the invite link. Please copy it manually.",
            });
        }
    }

    return (
        <>
            <Stack gap="md" className="trip-detail">
                <header
                    className="trip-detail__header"
                    style={{ backgroundImage: TRIP_DETAIL_HEADER_BACKGROUND_IMAGE }}
                >
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
                                        <Button type="submit" disabled={creatingInvitation} className="trip-detail__action trip-detail__action--edit">
                                            Create invitation link
                                        </Button>
                                    </div>
                                    {inviteFeedback && (
                                        <p
                                            className={`trip-detail__feedback trip-detail__feedback--${inviteFeedback.tone}`}
                                            role="status"
                                            aria-live="polite"
                                        >
                                            <Icon name={inviteFeedback.tone === "success" ? "circleCheck" : "circleAlert"} width={16} height={16} />
                                            {inviteFeedback.message}
                                        </p>
                                    )}
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
                                                <p><span className="trip-detail__invite-field-label">Email</span><strong>{invitation.email}</strong></p>
                                                <p><span className="trip-detail__invite-field-label">Role</span>{roleLabel(invitation.role)}</p>
                                                {inviteLink && (
                                                    <p className="trip-detail__invite-link">
                                                        <span className="trip-detail__invite-field-label">Invitation link</span>
                                                        <code>{inviteLink}</code>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            compact
                                                            onClick={() => void copyInviteLink(invitation.id, inviteLink)}
                                                            className="trip-detail__action trip-detail__action--edit"
                                                        >
                                                            Copy link
                                                        </Button>
                                                    </p>
                                                )}
                                                <div className="trip-detail__invite-actions trip-detail__invite-actions--card">
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
                                                {invitationActionFeedback?.invitationId === invitation.id && (
                                                    <p
                                                        className={`trip-detail__subtle-status trip-detail__subtle-status--${invitationActionFeedback.tone}`}
                                                        role="status"
                                                        aria-live="polite"
                                                    >
                                                        {invitationActionFeedback.message}
                                                    </p>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>

                                {invitationListFeedback && (
                                    <p
                                        className={`trip-detail__feedback trip-detail__feedback--${invitationListFeedback.tone}`}
                                        role="status"
                                        aria-live="polite"
                                    >
                                        <Icon name={invitationListFeedback.tone === "success" ? "circleCheck" : "circleAlert"} width={16} height={16} />
                                        {invitationListFeedback.message}
                                    </p>
                                )}

                                <Button type="button" variant="outline" onClick={() => setHistoryOpen(true)} className="trip-detail__action trip-detail__action--history">
                                    Invitation History ({historicalInvitations.length})
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
                    {historicalInvitations.length === 0 && <p>No invitation history.</p>}
                    {historicalInvitations.map(invitation => (
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
