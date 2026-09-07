import { describe, expect, it } from "vitest";
import { matchPath } from "react-router-dom";

import { ACCEPT_INVITE_PATH_PREFIX, buildInviteShareLink } from "./invitationLink";

describe("buildInviteShareLink", () => {
    it("prefixes the relative acceptLink with the current origin at a root base", () => {
        expect(buildInviteShareLink("https://app.example.com", "/accept-invite/abc123", "/"))
            .toBe("https://app.example.com/accept-invite/abc123");
    });

    it("includes the sub-path base the app is served from", () => {
        // GitHub Pages serves the app from /TravelCompanion/; without the base
        // the shared link points at the origin root and 404s.
        expect(buildInviteShareLink("https://smajla82-hub.github.io", "/accept-invite/abc123", "/TravelCompanion/"))
            .toBe("https://smajla82-hub.github.io/TravelCompanion/accept-invite/abc123");
    });

    it("does not duplicate the slash between the base and the acceptLink", () => {
        expect(buildInviteShareLink("https://app.example.com", "/accept-invite/abc123", "/base/"))
            .not.toContain("//accept-invite");
    });

    it("defaults to the app's configured base URL", () => {
        expect(buildInviteShareLink("https://app.example.com", "/accept-invite/abc123"))
            .toBe(`https://app.example.com${import.meta.env.BASE_URL.replace(/\/+$/, "")}/accept-invite/abc123`);
    });
});

describe("ACCEPT_INVITE_PATH_PREFIX", () => {
    it("matches the frontend route mounted for invitation acceptance", () => {
        // Guards against the acceptLink/route mismatch where the backend
        // returned a path (`/invitations/:token/accept`) that had no
        // corresponding frontend <Route>, making invitations unopenable.
        const acceptLink = `${ACCEPT_INVITE_PATH_PREFIX}some-token`;
        const match = matchPath(`${ACCEPT_INVITE_PATH_PREFIX}:token`, acceptLink);

        expect(match?.params.token).toBe("some-token");
    });
});
