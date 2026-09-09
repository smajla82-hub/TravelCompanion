/* @vitest-environment jsdom */
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Invitation, TripMember } from "../../api/trips";
import type { Trip } from "../../types";

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

import { TripDetail } from "./TripDetail";

const baseTrip: Trip = {
    id: "trip-1",
    destination: "Riva del Garda",
    name: "Lake Garda",
    country: "IT",
    startDate: "2026-09-01",
    endDate: "2026-09-05",
    travellers: 2,
    status: "planning",
};

function makeAdapter(overrides?: Partial<ReturnType<typeof makeAdapter>>) {
    return {
        source: "online" as const,
        getTrip: vi.fn(),
        setItinerary: vi.fn(),
        addDay: vi.fn(),
        updateDay: vi.fn(),
        deleteDay: vi.fn(),
        addItem: vi.fn(),
        updateItem: vi.fn(),
        deleteItem: vi.fn(),
        reorderItems: vi.fn(),
        addVenue: vi.fn(),
        updateVenue: vi.fn(),
        deleteVenue: vi.fn(),
        addParking: vi.fn(),
        updateParking: vi.fn(),
        deleteParking: vi.fn(),
        acquireLock: vi.fn(),
        heartbeat: vi.fn(),
        releaseLock: vi.fn(),
        members: vi.fn<() => Promise<TripMember[]>>().mockResolvedValue([]),
        invitations: vi.fn<() => Promise<Invitation[]>>().mockResolvedValue([]),
        invite: vi.fn(),
        sendInvitationEmail: vi.fn(),
        revokeInvitation: vi.fn(),
        updateTrip: vi.fn(),
        setActive: vi.fn(),
        ...overrides,
    };
}

async function render(component: ReactElement) {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(component);
    });
    await act(async () => {
        await Promise.resolve();
    });
    return {
        container,
        root,
        cleanup: async () => {
            await act(async () => {
                root.unmount();
            });
            container.remove();
        },
    };
}

function buttonByText(container: HTMLElement, text: string) {
    return Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes(text));
}

describe("TripDetail", () => {
    const cleanups: Array<() => Promise<void>> = [];

    afterEach(async () => {
        while (cleanups.length > 0) {
            await cleanups.pop()?.();
        }
        vi.clearAllMocks();
    });

    beforeEach(() => {
        mocks.useTrips.mockReturnValue({ activeTrip: null });
        mocks.getUser.mockReturnValue({ id: "owner-id" });
        mocks.isCurrentActiveTrip.mockReturnValue(false);
    });

    it("does not render online collaboration UI for offline trips", async () => {
        const adapter = makeAdapter({ source: "local" as const });
        mocks.createTripAdapter.mockReturnValue(adapter);

        const ui = await render(<TripDetail trip={{ ...baseTrip, source: "local" }} />);
        cleanups.push(ui.cleanup);

        expect(ui.container.textContent).not.toContain("Members");
        expect(ui.container.textContent).not.toContain("Invite collaborator");
        expect(ui.container.textContent).not.toContain("Invitation History");
    });

    it("keeps viewer set-active action available while preserving permissions", async () => {
        const adapter = makeAdapter({
            members: vi.fn().mockResolvedValue([
                { userId: "viewer-id", email: "viewer@example.com", role: "viewer" },
            ]),
        });
        mocks.createTripAdapter.mockReturnValue(adapter);
        mocks.getUser.mockReturnValue({ id: "viewer-id" });
        const onSetActive = vi.fn();

        const ui = await render(<TripDetail trip={{ ...baseTrip, source: "online" }} onSetActive={onSetActive} />);
        cleanups.push(ui.cleanup);

        const setActive = buttonByText(ui.container, "Set as Active Trip");
        expect(setActive).toBeTruthy();
        setActive?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(onSetActive).toHaveBeenCalledTimes(1);

        expect(buttonByText(ui.container, "Edit Trip")).toBeFalsy();
        expect(buttonByText(ui.container, "Delete Trip")).toBeFalsy();
    });

    it("renders member roles, invitation history, and separate link/email invitation actions", async () => {
        const adapter = makeAdapter({
            members: vi.fn().mockResolvedValue([
                { userId: "owner-id", email: "owner@example.com", displayName: "Trip Owner", role: "owner" },
                { userId: "editor-id", email: "editor@example.com", displayName: "Trip Editor", role: "editor" },
                { userId: "viewer-id", email: "viewer@example.com", displayName: "Trip Viewer", role: "viewer" },
            ]),
            invitations: vi.fn().mockResolvedValue([
                { id: "pending-1", email: "pending@example.com", role: "viewer", status: "pending", token: "t1", acceptLink: "/accept-invite/t1", createdAt: "2026-09-01T09:00:00.000Z", updatedAt: "2026-09-01T09:00:00.000Z" },
                { id: "accepted-1", email: "accepted@example.com", role: "editor", status: "accepted", token: "t2", createdAt: "2026-09-01T09:00:00.000Z", updatedAt: "2026-09-02T09:00:00.000Z" },
                { id: "revoked-1", email: "revoked@example.com", role: "viewer", status: "revoked", token: "t3", createdAt: "2026-09-01T09:00:00.000Z", updatedAt: "2026-09-03T09:00:00.000Z" },
            ]),
            invite: vi.fn()
                .mockResolvedValueOnce({ id: "created-link", email: "link@example.com", role: "editor", status: "pending", token: "link-token", acceptLink: "/accept-invite/link-token" })
                .mockResolvedValueOnce({ id: "created-email", email: "mail@example.com", role: "viewer", status: "pending", token: "mail-token", acceptLink: "/accept-invite/mail-token" }),
            sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
        });
        mocks.createTripAdapter.mockReturnValue(adapter);

        const ui = await render(<TripDetail trip={{ ...baseTrip, source: "online" }} />);
        cleanups.push(ui.cleanup);

        expect(ui.container.textContent).toContain("Trip Owner");
        expect(ui.container.textContent).toContain("Trip Editor");
        expect(ui.container.textContent).toContain("Trip Viewer");
        expect(ui.container.textContent).toContain("OWNER");
        expect(ui.container.textContent).toContain("EDITOR");
        expect(ui.container.textContent).toContain("VIEWER");

        expect(ui.container.textContent).toContain("pending@example.com");
        expect(ui.container.textContent).not.toContain("accepted@example.com");
        expect(ui.container.textContent).not.toContain("revoked@example.com");

        buttonByText(ui.container, "Invitation History")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await act(async () => {
            await Promise.resolve();
        });
        expect(ui.container.textContent).toContain("accepted@example.com");
        expect(ui.container.textContent).toContain("revoked@example.com");

        const emailInput = ui.container.querySelector("#trip-detail-invite-email") as HTMLInputElement;
        const roleSelect = ui.container.querySelector("#trip-detail-invite-role") as HTMLSelectElement;

        emailInput.value = "link@example.com";
        roleSelect.value = "editor";
        buttonByText(ui.container, "Create invitation link")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await act(async () => {
            await Promise.resolve();
        });

        expect(adapter.invite).toHaveBeenCalledTimes(1);
        expect(adapter.sendInvitationEmail).toHaveBeenCalledTimes(0);

        emailInput.value = "mail@example.com";
        roleSelect.value = "viewer";
        buttonByText(ui.container, "Send invitation email")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await act(async () => {
            await Promise.resolve();
        });

        expect(adapter.invite).toHaveBeenCalledTimes(2);
        expect(adapter.sendInvitationEmail).toHaveBeenCalledTimes(1);
        expect(adapter.sendInvitationEmail).toHaveBeenCalledWith("created-email");
    });
});
