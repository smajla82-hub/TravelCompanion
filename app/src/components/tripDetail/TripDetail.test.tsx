import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Invitation, TripMember } from "../../api/trips";
import { SETTINGS_BACKGROUND_URL } from "../../styles/brandAssets";

const mocks = vi.hoisted(() => {
    const createTripAdapter = vi.fn();
    const useTrips = vi.fn(() => ({ activeTrip: null }));
    const getUser = vi.fn(() => ({ id: "owner-id" }));
    const isCurrentActiveTrip = vi.fn(() => false);
    return { createTripAdapter, useTrips, getUser, isCurrentActiveTrip };
});

vi.mock("../../services/TripAdapter", () => ({
    createTripAdapter: mocks.createTripAdapter,
}));

vi.mock("../../hooks", () => ({
    useTrips: mocks.useTrips,
}));

vi.mock("../../services/AuthService", () => ({
    AuthService: {
        getUser: mocks.getUser,
    },
}));

vi.mock("../../utils/selectActiveTrip", () => ({
    isCurrentActiveTrip: mocks.isCurrentActiveTrip,
}));

import { ApiError } from "../../api/client";
import { TripDetail, TRIP_DETAIL_HEADER_BACKGROUND_IMAGE, runInviteTopAction } from "./TripDetail";

const baseTrip = {
    id: "trip-1",
    destination: "Riva del Garda",
    name: "Lake Garda",
    country: "IT",
    startDate: "2026-09-01",
    endDate: "2026-09-05",
    travellers: 2,
    status: "planning" as const,
};

const onlineAdapter = {
    source: "online" as const,
    members: vi.fn(),
    invitations: vi.fn(),
    invite: vi.fn(),
    sendInvitationEmail: vi.fn(),
    revokeInvitation: vi.fn(),
};

const localAdapter = {
    ...onlineAdapter,
    source: "local" as const,
};

describe("TripDetail", () => {
    it("uses base-aware settings artwork URL for the header background", () => {
        expect(SETTINGS_BACKGROUND_URL).toContain("/assets/settings_background1440x3200.webp");
        expect(TRIP_DETAIL_HEADER_BACKGROUND_IMAGE).toContain(`url("${SETTINGS_BACKGROUND_URL}")`);
    });

    it("does not render online collaboration UI for offline trips", () => {
        mocks.createTripAdapter.mockReturnValue(localAdapter);

        const markup = renderToStaticMarkup(
            <TripDetail
                trip={{ ...baseTrip, source: "local" }}
            />,
        );

        expect(markup).not.toContain("Members");
        expect(markup).not.toContain("Invite collaborator");
        expect(markup).not.toContain("Invitation History");
    });

    it("keeps viewer set-active action visible", () => {
        mocks.createTripAdapter.mockReturnValue(onlineAdapter);
        mocks.getUser.mockReturnValue({ id: "viewer-id" });

        const members: TripMember[] = [
            { userId: "viewer-id", email: "viewer@example.com", role: "viewer" },
        ];

        const markup = renderToStaticMarkup(
            <TripDetail
                trip={{ ...baseTrip, source: "online" }}
                initialMembers={members}
                onSetActive={() => undefined}
            />,
        );

        expect(markup).toContain("Set as Active Trip");
        expect(markup).not.toContain("Edit Trip");
        expect(markup).not.toContain("Delete Trip");
    });

    it("renders role badges and invitation history entries", () => {
        mocks.createTripAdapter.mockReturnValue(onlineAdapter);
        mocks.getUser.mockReturnValue({ id: "owner-id" });

        const members: TripMember[] = [
            { userId: "owner-id", email: "owner@example.com", displayName: "Trip Owner", role: "owner" },
            { userId: "editor-id", email: "editor@example.com", displayName: "Trip Editor", role: "editor" },
            { userId: "viewer-id", email: "viewer@example.com", displayName: "Trip Viewer", role: "viewer" },
        ];
        const invitations: Invitation[] = [
            { id: "pending", email: "pending@example.com", role: "viewer", status: "pending", token: "token-p", acceptLink: "/accept-invite/token-p", createdAt: "2026-09-01T09:00:00.000Z", updatedAt: "2026-09-01T09:00:00.000Z" },
            { id: "accepted", email: "accepted@example.com", role: "editor", status: "accepted", token: "token-a", createdAt: "2026-09-01T09:00:00.000Z", updatedAt: "2026-09-02T09:00:00.000Z" },
            { id: "revoked", email: "revoked@example.com", role: "viewer", status: "revoked", token: "token-r", createdAt: "2026-09-01T09:00:00.000Z", updatedAt: "2026-09-03T09:00:00.000Z" },
        ];

        const markup = renderToStaticMarkup(
            <TripDetail
                trip={{ ...baseTrip, source: "online" }}
                initialMembers={members}
                initialInvitations={invitations}
                initialHistoryOpen
            />,
        );

        expect(markup).toContain("Trip Owner");
        expect(markup).toContain("Trip Editor");
        expect(markup).toContain("Trip Viewer");
        expect(markup).toContain("OWNER");
        expect(markup).toContain("EDITOR");
        expect(markup).toContain("VIEWER");

        expect(markup).toContain("Current invitations");
        expect(markup).toContain("pending@example.com");
        expect(markup).not.toContain("accepted@example.com —");
        expect(markup).toContain("Invitation History");
        expect(markup).toContain("accepted@example.com");
        expect(markup).toContain("revoked@example.com");
        expect(markup).toContain("Create invitation link");
        expect(markup).toContain("Send invitation email");
    });

    it("reports link creation success without triggering invitation email delivery", async () => {
        const invitation: Invitation = {
            id: "invite-1",
            email: "pending@example.com",
            role: "viewer",
            status: "pending",
            token: "token-1",
            acceptLink: "/accept-invite/token-1",
        };
        const sendInvitationEmail = vi.fn();

        const result = await runInviteTopAction({
            createInvitation: async () => invitation,
            listInvitations: async () => [invitation],
            sendInvitationEmail,
            currentInvitations: [],
            delivery: "link",
        });

        expect(result.feedback.message).toBe("Invitation link created.");
        expect(result.feedback.tone).toBe("success");
        expect(result.invitations).toEqual([invitation]);
        expect(sendInvitationEmail).not.toHaveBeenCalled();
    });

    it("creates once and reports email success for top send action", async () => {
        const invitation: Invitation = {
            id: "invite-email",
            email: "pending@example.com",
            role: "editor",
            status: "pending",
            token: "token-email",
            acceptLink: "/accept-invite/token-email",
        };
        const createInvitation = vi.fn(async () => invitation);
        const sendInvitationEmail = vi.fn(async () => undefined);

        const result = await runInviteTopAction({
            createInvitation,
            listInvitations: async () => [invitation],
            sendInvitationEmail,
            currentInvitations: [],
            delivery: "email",
        });

        expect(createInvitation).toHaveBeenCalledTimes(1);
        expect(sendInvitationEmail).toHaveBeenCalledWith(invitation.id);
        expect(result.feedback.message).toBe("Invitation email sent.");
        expect(result.feedback.tone).toBe("success");
        expect(result.invitations).toEqual([invitation]);
    });

    it("handles wrapped invitation creation payloads", async () => {
        const invitation: Invitation = {
            id: "invite-wrapped",
            email: "pending@example.com",
            role: "viewer",
            status: "pending",
            token: "token-wrapped",
        };
        const sendInvitationEmail = vi.fn(async () => undefined);

        const result = await runInviteTopAction({
            createInvitation: async () => ({ invitation }),
            listInvitations: async () => [invitation],
            sendInvitationEmail,
            currentInvitations: [],
            delivery: "email",
        });

        expect(sendInvitationEmail).toHaveBeenCalledWith(invitation.id);
        expect(result.feedback.message).toBe("Invitation email sent.");
    });

    it("avoids duplicate local invitations when list refresh fails", async () => {
        const invitation: Invitation = {
            id: "invite-existing",
            email: "existing@example.com",
            role: "viewer",
            status: "pending",
            token: "token-existing",
        };

        const result = await runInviteTopAction({
            createInvitation: async () => invitation,
            listInvitations: async () => Promise.reject(new Error("list failed")),
            sendInvitationEmail: async () => undefined,
            currentInvitations: [invitation],
            delivery: "link",
        });

        expect(result.invitations).toHaveLength(1);
        expect(result.invitations[0]?.id).toBe(invitation.id);
    });

    it("separates invitation creation failures from email delivery failures", async () => {
        const invitation: Invitation = {
            id: "invite-separation",
            email: "pending@example.com",
            role: "viewer",
            status: "pending",
            token: "token-separation",
        };

        const creationFailure = await runInviteTopAction({
            createInvitation: async () => Promise.reject(new Error("boom")),
            listInvitations: async () => [],
            sendInvitationEmail: async () => undefined,
            currentInvitations: [],
            delivery: "email",
        });
        expect(creationFailure.feedback.message).toBe("Unable to create invitation.");

        const emailFailure = await runInviteTopAction({
            createInvitation: async () => invitation,
            listInvitations: async () => [invitation],
            sendInvitationEmail: async () => Promise.reject(new ApiError("SMTP unavailable")),
            currentInvitations: [],
            delivery: "email",
        });
        expect(emailFailure.feedback.message).toBe("SMTP unavailable");
        expect(emailFailure.invitations).toEqual([invitation]);
    });
});
