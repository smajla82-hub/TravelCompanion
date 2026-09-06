import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthService } from "./AuthService";

describe("AuthService", () => {
    beforeEach(() => {
        const values = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("stores the session returned by login", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response(JSON.stringify({
                token: "session-token",
                user: { id: "user-1", email: "traveller@example.com" },
            })),
        ));

        await expect(AuthService.login("traveller@example.com", "password"))
            .resolves.toEqual({ id: "user-1", email: "traveller@example.com" });

        expect(AuthService.getToken()).toBe("session-token");
        expect(AuthService.getUser()).toEqual({
            id: "user-1",
            email: "traveller@example.com",
        });
    });

    it("clears the session on logout", () => {
        AuthService.logout();

        expect(AuthService.getToken()).toBeNull();
        expect(AuthService.getUser()).toBeUndefined();
    });
});
