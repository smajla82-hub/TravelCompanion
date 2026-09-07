import { describe, expect, it } from "vitest";

import { isCurrentActiveTrip, selectActiveTrip } from "./selectActiveTrip";
import type { Trip } from "../types";

function trip(overrides: Partial<Trip> & { id: string }): Trip {
    return {
        destination: "Lago di Garda",
        country: "Italy",
        startDate: "2026-09-01",
        endDate: "2026-09-05",
        travellers: 2,
        status: "planning",
        ...overrides,
    };
}

describe("selectActiveTrip", () => {
    it("returns the active online trip", () => {
        const active = selectActiveTrip([
            trip({ id: "online-1", source: "online", status: "active" }),
            trip({ id: "online-2", source: "online" }),
        ]);

        expect(active?.id).toBe("online-1");
    });

    it("returns the active offline trip when no online trip is active", () => {
        const active = selectActiveTrip([
            trip({ id: "local-1" }),
            trip({ id: "local-2", status: "active" }),
            trip({ id: "online-1", source: "online" }),
        ]);

        expect(active?.id).toBe("local-2");
    });

    it("uses an explicit local selection even when an online trip is server-active", () => {
        const active = selectActiveTrip([
            trip({ id: "local-1", status: "active" }),
            trip({ id: "online-1", source: "online", status: "active" }),
        ], { source: "local", id: "local-1" });

        expect(active?.id).toBe("local-1");
        expect(active?.source).toBeUndefined();
    });

    it("keeps the explicit offline selection after a client refresh", () => {
        const refreshedTrips = [
            trip({ id: "local-1", status: "active" }),
            trip({ id: "online-1", source: "online", status: "active" }),
        ];

        expect(selectActiveTrip(refreshedTrips, { source: "local", id: "local-1" })?.id)
            .toBe("local-1");
    });

    it("lets an explicit online selection override a previous local selection after it is cleared", () => {
        const active = selectActiveTrip([
            trip({ id: "local-1", status: "active" }),
            trip({ id: "online-1", source: "online", status: "active" }),
        ], { source: "online", id: "online-1" });

        expect(active?.id).toBe("online-1");
    });

    it("does not let stale local active state compete while an explicit online selection reloads", () => {
        const active = selectActiveTrip([
            trip({ id: "local-1", status: "active" }),
        ], { source: "online", id: "online-1" });

        expect(active).toBeUndefined();
    });

    it("preserves explicit online selection after refresh reconstruction", () => {
        const refreshedTrips = [
            trip({ id: "local-1", status: "active" }),
            trip({ id: "online-1", source: "online", status: "active" }),
        ];

        expect(selectActiveTrip(refreshedTrips, { source: "online", id: "online-1" })?.id)
            .toBe("online-1");
    });

    it("switches Online A to Online B from the server active flags", () => {
        const active = selectActiveTrip([
            trip({ id: "online-a", source: "online" }),
            trip({ id: "online-b", source: "online", status: "active" }),
        ]);

        expect(active?.id).toBe("online-b");
    });

    it("switches Online to Offline when the local selection is set", () => {
        const active = selectActiveTrip([
            trip({ id: "local-1", status: "active" }),
            trip({ id: "online-1", source: "online", status: "active" }),
        ], { source: "local", id: "local-1" });

        expect(active?.id).toBe("local-1");
    });

    it("switches Offline to Online when the local selection is cleared", () => {
        const active = selectActiveTrip([
            trip({ id: "local-1", status: "active" }),
            trip({ id: "online-1", source: "online", status: "active" }),
        ], { source: "online", id: "online-1" });

        expect(active?.id).toBe("online-1");
    });

    it("keeps online server active state intact when offline is selected", () => {
        const onlineTrip = trip({ id: "online-1", source: "online", status: "active" });

        const active = selectActiveTrip([
            trip({ id: "local-1", status: "active" }),
            onlineTrip,
        ], { source: "local", id: "local-1" });

        expect(active?.id).toBe("local-1");
        expect(onlineTrip.status).toBe("active");
    });

    it("handles Offline A to Online A to Offline A", () => {
        const trips = [
            trip({ id: "local-a", status: "active" }),
            trip({ id: "online-a", source: "online", status: "active" }),
        ];

        expect(selectActiveTrip(trips, { source: "local", id: "local-a" })?.id)
            .toBe("local-a");
        expect(selectActiveTrip(trips, { source: "online", id: "online-a" })?.id)
            .toBe("online-a");
        expect(selectActiveTrip(trips, { source: "local", id: "local-a" })?.id)
            .toBe("local-a");
    });

    it("handles Offline A to Online A to Offline B", () => {
        const trips = [
            trip({ id: "local-a", status: "planning" }),
            trip({ id: "local-b", status: "active" }),
            trip({ id: "online-a", source: "online", status: "active" }),
        ];

        expect(selectActiveTrip(trips, { source: "local", id: "local-a" })?.id)
            .toBe("local-a");
        expect(selectActiveTrip(trips, { source: "online", id: "online-a" })?.id)
            .toBe("online-a");
        expect(selectActiveTrip(trips, { source: "local", id: "local-b" })?.id)
            .toBe("local-b");
    });

    it("handles Online A to Offline A to Online A", () => {
        const trips = [
            trip({ id: "local-a", status: "active" }),
            trip({ id: "online-a", source: "online", status: "active" }),
        ];

        expect(selectActiveTrip(trips, { source: "online", id: "online-a" })?.id)
            .toBe("online-a");
        expect(selectActiveTrip(trips, { source: "local", id: "local-a" })?.id)
            .toBe("local-a");
        // A stale local "active" status must not block re-selecting the
        // online Trip that was previously switched away from.
        expect(selectActiveTrip(trips, { source: "online", id: "online-a" })?.id)
            .toBe("online-a");
    });

    it("handles Offline A to Online A to Offline B to Online A", () => {
        const trips = [
            trip({ id: "local-a", status: "planning" }),
            trip({ id: "local-b", status: "active" }),
            // Server active state for online-a is never cleared just because
            // this device switched to an Offline Trip.
            trip({ id: "online-a", source: "online", status: "active" }),
        ];

        expect(selectActiveTrip(trips, { source: "local", id: "local-a" })?.id)
            .toBe("local-a");
        expect(selectActiveTrip(trips, { source: "online", id: "online-a" })?.id)
            .toBe("online-a");
        expect(selectActiveTrip(trips, { source: "local", id: "local-b" })?.id)
            .toBe("local-b");
        // Re-selecting the previously selected online Trip must still work.
        expect(selectActiveTrip(trips, { source: "online", id: "online-a" })?.id)
            .toBe("online-a");
    });

    it("handles Online A to Offline B to Online A to Offline B", () => {
        const trips = [
            trip({ id: "local-b", status: "active" }),
            trip({ id: "online-a", source: "online", status: "active" }),
        ];

        expect(selectActiveTrip(trips, { source: "online", id: "online-a" })?.id)
            .toBe("online-a");
        expect(selectActiveTrip(trips, { source: "local", id: "local-b" })?.id)
            .toBe("local-b");
        expect(selectActiveTrip(trips, { source: "online", id: "online-a" })?.id)
            .toBe("online-a");
        // Re-selecting the previously selected offline Trip must still work.
        expect(selectActiveTrip(trips, { source: "local", id: "local-b" })?.id)
            .toBe("local-b");
    });

    it("returns nothing when no trip is active", () => {
        expect(selectActiveTrip([trip({ id: "local-1" })])).toBeUndefined();
    });
});

describe("isCurrentActiveTrip", () => {
    it("is false for every Trip when nothing is active", () => {
        expect(isCurrentActiveTrip({ id: "local-a" }, undefined)).toBe(false);
    });

    it("does not treat a local Trip as current merely because an online Trip with the same id is active", () => {
        const active = trip({ id: "a", source: "online", status: "active" });

        expect(isCurrentActiveTrip({ id: "a", source: undefined }, active)).toBe(false);
        expect(isCurrentActiveTrip({ id: "a", source: "online" }, active)).toBe(true);
    });

    it("stops treating a Trip as current once the device switches away, and reflects it again when reselected", () => {
        const trips = [
            trip({ id: "local-a", status: "active" }),
            trip({ id: "online-a", source: "online", status: "active" }),
        ];

        // Offline A selected: only the local Trip counts as current, even
        // though local status is sticky and never reset by itself.
        let active = selectActiveTrip(trips, { source: "local", id: "local-a" });
        expect(isCurrentActiveTrip({ id: "local-a", source: undefined }, active)).toBe(true);
        expect(isCurrentActiveTrip({ id: "online-a", source: "online" }, active)).toBe(false);

        // Online A selected: the stale local "active" status must not make
        // the local Trip look current, and must not hide the local Trip's
        // Set Active button forever.
        active = selectActiveTrip(trips, { source: "online", id: "online-a" });
        expect(isCurrentActiveTrip({ id: "online-a", source: "online" }, active)).toBe(true);
        expect(isCurrentActiveTrip({ id: "local-a", source: undefined }, active)).toBe(false);

        // Offline A selected again: must be selectable and recognised as
        // current, even though the online Trip's server isActive flag is
        // still true.
        active = selectActiveTrip(trips, { source: "local", id: "local-a" });
        expect(isCurrentActiveTrip({ id: "local-a", source: undefined }, active)).toBe(true);
        expect(isCurrentActiveTrip({ id: "online-a", source: "online" }, active)).toBe(false);
    });
});
