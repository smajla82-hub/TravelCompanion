import { describe, expect, it } from "vitest";

import { selectActiveTrip } from "./selectActiveTrip";
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
        ], undefined);

        expect(active?.id).toBe("online-1");
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
        ]);

        expect(active?.id).toBe("online-1");
    });

    it("returns nothing when no trip is active", () => {
        expect(selectActiveTrip([trip({ id: "local-1" })])).toBeUndefined();
    });
});
