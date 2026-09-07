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
 *
 * The API deliberately returns `acceptLink` as a *router-relative* path (e.g.
 * `/accept-invite/<token>`) so it stays independent of where the frontend is
 * hosted. That path is relative to the router's `basename`, which is
 * `import.meta.env.BASE_URL` (see `main.tsx`). On GitHub Pages the app is
 * served from a sub-path (`/TravelCompanion/`), so the base must be inserted
 * here — otherwise the shared link points at the origin root and 404s.
 */
export function buildInviteShareLink(
    origin: string,
    acceptLink: string,
    baseUrl: string = import.meta.env.BASE_URL,
): string {
    // `baseUrl` is "/" or "/sub/path/"; drop the trailing slash so it joins the
    // leading slash of `acceptLink` without duplicating it.
    const base = baseUrl.replace(/\/+$/, "");

    return `${origin}${base}${acceptLink}`;
}
