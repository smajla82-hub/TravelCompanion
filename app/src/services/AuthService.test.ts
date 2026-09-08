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

    it("updates the stored user's display name via updateProfile", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response(JSON.stringify({
                id: "user-1",
                email: "traveller@example.com",
                displayName: "Ada Lovelace",
            })),
        ));

        await expect(AuthService.updateProfile("Ada Lovelace"))
            .resolves.toEqual({
                id: "user-1",
                email: "traveller@example.com",
                displayName: "Ada Lovelace",
            });

        expect(AuthService.getUser()).toEqual({
            id: "user-1",
            email: "traveller@example.com",
            displayName: "Ada Lovelace",
        });
    });

    it("requests a password reset link without leaking whether the email exists", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({
                message: "If an account exists for that email address, a password reset link has been sent.",
            })),
        );
        vi.stubGlobal("fetch", fetchMock);

        await expect(AuthService.requestPasswordReset("traveller@example.com"))
            .resolves.toEqual({
                message: "If an account exists for that email address, a password reset link has been sent.",
            });

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining("/auth/forgot-password"),
            expect.objectContaining({ method: "POST" }),
        );
    });

    it("submits a new password with the reset token", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({
                message: "Password updated successfully. You can now log in with your new password.",
            })),
        );
        vi.stubGlobal("fetch", fetchMock);

        await expect(AuthService.resetPassword("reset-token", "new-password-1"))
            .resolves.toEqual({
                message: "Password updated successfully. You can now log in with your new password.",
            });

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining("/auth/reset-password"),
            expect.objectContaining({ method: "POST" }),
        );
    });
});
