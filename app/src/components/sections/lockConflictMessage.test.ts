import { describe, expect, it } from "vitest";

import { ApiError } from "../../api/client";
import { lockConflictMessage } from "./lockConflictMessage";

describe("lockConflictMessage", () => {
    it("prefers the lock holder's display name over their email", () => {
        const error = new ApiError("conflict", {
            status: 409,
            body: { lockedBy: { email: "traveller@example.com", displayName: "Ada Lovelace" } },
        });

        expect(lockConflictMessage(error)).toBe(
            "This trip is currently being edited by Ada Lovelace. Please try again when they finish.",
        );
    });

    it("falls back to the email when no display name is set", () => {
        const error = new ApiError("conflict", {
            status: 409,
            body: { lockedBy: { email: "traveller@example.com" } },
        });

        expect(lockConflictMessage(error)).toBe(
            "This trip is currently being edited by traveller@example.com. Please try again when they finish.",
        );
    });

    it("falls back to a generic message when no lock holder identity is known", () => {
        const error = new ApiError("conflict", { status: 409, body: {} });

        expect(lockConflictMessage(error)).toBe(
            "This trip was changed by someone else. Please reload and retry.",
        );
    });
});
