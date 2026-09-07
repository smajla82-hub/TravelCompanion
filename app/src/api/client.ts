const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    "https://cestovatel.duckdns.org";

const TOKEN_KEY = "travel-companion.auth-token";

export class ApiError extends Error {
    status?: number;
    body?: unknown;
    offline: boolean;

    constructor(
        message: string,
        options: {
            status?: number;
            body?: unknown;
            offline?: boolean;
        } = {},
    ) {
        super(message);
        this.name = "ApiError";
        this.status = options.status;
        this.body = options.body;
        this.offline = options.offline ?? false;
    }
}

export function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getAuthToken();
    const headers = new Headers(options.headers);

    if (token) {
        headers.set("Authorization", ["Bearer", token].join(" "));
    }

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
        });
    } catch {
        throw new ApiError(
            "The sync service is unavailable. Your local trips remain available offline.",
            { offline: true },
        );
    }

    const body = await response.json().catch(() => undefined);

    if (!response.ok) {
        const serverMessage = typeof body === "object" && body &&
            "error" in body && typeof body.error === "string"
            ? body.error
            : undefined;

        // A response without a JSON error body (proxy failure, rate limiting,
        // unexpected status) still has to name the status so the failure is
        // reported truthfully instead of as an anonymous sync problem.
        const message = serverMessage
            ?? `The sync request could not be completed (HTTP ${response.status}).`;

        throw new ApiError(message, {
            status: response.status,
            body,
        });
    }

    return body as T;
}
