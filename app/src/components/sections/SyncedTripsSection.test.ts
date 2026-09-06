import { describe, expect, it } from "vitest";

import { ApiError } from "../../api/client";
import { lockConflictMessage } from "./lockConflictMessage";

describe("lockConflictMessage", () => {
    it("names the person holding an edit lock", () => {
        const error = new ApiError("Conflict", {
            status: 409,
            body: { lockedBy: { email: "editor@example.com" } },
        });

        expect(lockConflictMessage(error)).toContain("editor@example.com");
    });

    it("explains a mutation conflict without retrying it", () => {
        expect(lockConflictMessage(new ApiError("Conflict", { status: 409 })))
            .toBe("This trip was changed by someone else. Please reload and retry.");
    });
});
