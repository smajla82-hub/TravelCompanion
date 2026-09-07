import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    apiRequest,
    clearAuthToken,
    setAuthToken,
} from "./client";

describe("apiRequest", () => {
    beforeEach(() => {
        const values = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
        });
    });

    afterEach(() => {
        clearAuthToken();
        vi.unstubAllGlobals();
    });

    it("adds the stored JWT to requests", async () => {
        setAuthToken("jwt-token");
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ ok: true })),
        );
        vi.stubGlobal("fetch", fetchMock);

        await apiRequest("/auth/me");

        expect(fetchMock).toHaveBeenCalledWith(
            "https://cestovatel.duckdns.org/auth/me",
            expect.objectContaining({
                headers: expect.objectContaining({
                    get: expect.any(Function),
                }),
            }),
        );
        const headers = fetchMock.mock.calls[0][1].headers as Headers;
        expect(headers.get("Authorization")).toBe(
            ["Bearer", "jwt-token"].join(" "),
        );
    });

    it("reports the server error message of a rejected sync request", async () => {
        // The API rate limiter answers with JSON, so the user learns why the
        // request failed instead of seeing a generic sync failure.
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({ error: "Too many trip requests. Please wait a moment and try again." }),
                { status: 429 },
            ),
        ));

        await expect(apiRequest("/trips")).rejects.toMatchObject({
            status: 429,
            offline: false,
            message: "Too many trip requests. Please wait a moment and try again.",
        });
    });

    it("names the status when a failed response carries no JSON error", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response("Too many requests, please try again later.", { status: 429 }),
        ));

        await expect(apiRequest("/trips")).rejects.toMatchObject({
            status: 429,
            message: "The sync request could not be completed (HTTP 429).",
        });
    });

    it("distinguishes an unreachable service", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

        await expect(apiRequest("/trips")).rejects.toMatchObject({
            offline: true,
        });
    });
});
