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
    it("returns the active offline trip when no online trip is active", () => {
        const active = selectActiveTrip([
            trip({ id: "local-1" }),
            trip({ id: "local-2", status: "active" }),
            trip({ id: "online-1", source: "online" }),
        ]);

        expect(active?.id).toBe("local-2");
    });

    it("prefers the active online trip as the single active trip", () => {
        const active = selectActiveTrip([
            trip({ id: "local-1", status: "active" }),
            trip({ id: "online-1", source: "online", status: "active" }),
        ]);

        expect(active?.id).toBe("online-1");
        expect(active?.source).toBe("online");
    });

    it("returns nothing when no trip is active", () => {
        expect(selectActiveTrip([trip({ id: "local-1" })])).toBeUndefined();
    });
});
