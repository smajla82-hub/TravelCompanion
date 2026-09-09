import { ApiError } from "../../api/client";
import type { Invitation } from "../../api/trips";

type Feedback = {
    tone: "success" | "error";
    message: string;
};

export type InviteDelivery = "link" | "email";

type InvitationResponse = Invitation | { invitation: Invitation };

type InviteTopActionResult = {
    invitations: Invitation[];
    feedback: Feedback;
};

function feedbackMessage(reason: unknown, fallback: string) {
    return reason instanceof ApiError ? reason.message : fallback;
}

function resolveInvitation(payload: InvitationResponse) {
    if ("id" in payload) {
        return payload;
    }
    return payload.invitation;
}

function mergeInvitation(invitations: Invitation[], invitation: Invitation) {
    return invitations.some(current => current.id === invitation.id)
        ? invitations
        : [invitation, ...invitations];
}

export async function runInviteTopAction({
    createInvitation,
    listInvitations,
    sendInvitationEmail,
    currentInvitations,
    delivery,
}: {
    createInvitation: () => Promise<InvitationResponse>;
    listInvitations: () => Promise<Invitation[]>;
    sendInvitationEmail: (invitationId: string) => Promise<void>;
    currentInvitations: Invitation[];
    delivery: InviteDelivery;
}): Promise<InviteTopActionResult> {
    let createdInvitation: Invitation;
    try {
        createdInvitation = resolveInvitation(await createInvitation());
    } catch (reason) {
        return {
            invitations: currentInvitations,
            feedback: { tone: "error", message: feedbackMessage(reason, "Unable to create invitation.") },
        };
    }

    const invitations = await listInvitations()
        .catch(() => mergeInvitation(currentInvitations, createdInvitation));

    if (delivery === "link") {
        return {
            invitations,
            feedback: { tone: "success", message: "Invitation link created." },
        };
    }

    try {
        await sendInvitationEmail(createdInvitation.id);
        return {
            invitations,
            feedback: { tone: "success", message: "Invitation email sent." },
        };
    } catch (reason) {
        return {
            invitations,
            feedback: { tone: "error", message: feedbackMessage(reason, "Unable to send invitation email.") },
        };
    }
}
