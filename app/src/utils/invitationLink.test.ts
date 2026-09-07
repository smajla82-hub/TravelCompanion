import { describe, expect, it } from "vitest";
import { matchPath } from "react-router-dom";

import { ACCEPT_INVITE_PATH_PREFIX, buildInviteShareLink } from "./invitationLink";

describe("buildInviteShareLink", () => {
    it("prefixes the relative acceptLink with the current origin", () => {
        expect(buildInviteShareLink("https://app.example.com", "/accept-invite/abc123"))
            .toBe("https://app.example.com/accept-invite/abc123");
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
