/**
 * The frontend route (mounted in `AppRouter`) that renders the invitation
 * accept/decline page. The backend's `acceptLink` field must always point at
 * this path, or an invited collaborator has no way to open the invitation.
 */
export const ACCEPT_INVITE_PATH_PREFIX = "/accept-invite/";

/**
 * Builds a full, shareable URL for a pending invitation from the relative
 * `acceptLink` returned by the API, so the trip owner can copy/send it to the
 * invitee.
 */
export function buildInviteShareLink(origin: string, acceptLink: string): string {
    return `${origin}${acceptLink}`;
}
