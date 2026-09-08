import {
    apiRequest,
    clearAuthToken,
    getAuthToken,
    setAuthToken,
} from "../api/client";

export type AuthUser = {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string | null;
};

type AuthResponse = {
    token: string;
    user: AuthUser;
};

type MessageResponse = {
    message: string;
};

const USER_KEY = "travel-companion.auth-user";

function storeUser(user: AuthUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export const AuthService = {
    getToken: getAuthToken,

    getUser(): AuthUser | undefined {
        const stored = localStorage.getItem(USER_KEY);
        if (!stored) {
            return;
        }
        try {
            return JSON.parse(stored) as AuthUser;
        } catch {
            return;
        }
    },

    async login(email: string, password: string) {
        const response = await apiRequest<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        setAuthToken(response.token);
        storeUser(response.user);
        return response.user;
    },

    async register(email: string, password: string, firstName = "", lastName = "") {
        const response = await apiRequest<AuthResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, password, firstName, lastName }),
        });
        setAuthToken(response.token);
        storeUser(response.user);
        return response.user;
    },

    /**
     * Updates the signed-in user's display name (shown instead of their email
     * wherever other trip members/collaborators see their identity). Passing
     * an empty string clears it back to falling back on the email address.
     */
    async updateProfile(firstName: string, lastName?: string) {
        const user = await apiRequest<AuthUser>("/auth/profile", {
            method: "PUT",
            body: JSON.stringify(lastName === undefined ? { displayName: firstName } : { firstName, lastName }),
        });
        storeUser(user);
        return user;
    },

    /**
     * Always resolves — the API intentionally returns the same generic
     * message whether or not the email matches an account, so the caller
     * can't (and shouldn't try to) distinguish the two cases.
     */
    requestPasswordReset(email: string) {
        return apiRequest<MessageResponse>("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    },

    resetPassword(token: string, password: string) {
        return apiRequest<MessageResponse>("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, password }),
        });
    },

    logout() {
        clearAuthToken();
        localStorage.removeItem(USER_KEY);
    },
};
