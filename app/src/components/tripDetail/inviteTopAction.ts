import { ApiError } from "../../api/client";
import type { Invitation, InvitationCreateResponse } from "../../api/trips";

type Feedback = {
    tone: "success" | "error";
    message: string;
};

type InvitationResponse = InvitationCreateResponse | { invitation: Invitation; alreadyGenerated?: boolean };

type InviteTopActionResult = {
    invitations: Invitation[];
    feedback: Feedback;
    alreadyGenerated: boolean;
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

function resolveAlreadyGenerated(payload: InvitationResponse) {
    return "alreadyGenerated" in payload ? payload.alreadyGenerated === true : false;
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function dedupeById(invitations: Invitation[]) {
    const seen = new Set<string>();
    return invitations.filter(invitation => {
        if (seen.has(invitation.id)) return false;
        seen.add(invitation.id);
        return true;
    });
}

function mergeInvitation(invitations: Invitation[], invitation: Invitation) {
    return dedupeById(
        invitations.some(current => current.id === invitation.id)
            ? invitations
            : [invitation, ...invitations],
    );
}

export async function runInviteTopAction({
    email,
    createInvitation,
    listInvitations,
    currentInvitations,
}: {
    email: string;
    createInvitation: () => Promise<InvitationResponse>;
    listInvitations: () => Promise<Invitation[]>;
    currentInvitations: Invitation[];
}): Promise<InviteTopActionResult> {
    const existing = currentInvitations.find(invitation =>
        invitation.status === "pending"
        && normalizeEmail(invitation.email) === normalizeEmail(email),
    );
    if (existing) {
        return {
            invitations: dedupeById(currentInvitations),
            feedback: { tone: "success", message: "Invitation link already generated." },
            alreadyGenerated: true,
        };
    }

    let response: InvitationResponse;
    let createdInvitation: Invitation;
    try {
        response = await createInvitation();
        createdInvitation = resolveInvitation(response);
    } catch (reason) {
        return {
            invitations: dedupeById(currentInvitations),
            feedback: { tone: "error", message: feedbackMessage(reason, "Unable to create invitation.") },
            alreadyGenerated: false,
        };
    }

    const alreadyGenerated = resolveAlreadyGenerated(response);
    const invitations = dedupeById(
        await listInvitations()
            .catch(() => mergeInvitation(currentInvitations, createdInvitation)),
    );
    return {
        invitations,
        feedback: {
            tone: "success",
            message: alreadyGenerated ? "Invitation link already generated." : "Invitation link created.",
        },
        alreadyGenerated,
    };
}
