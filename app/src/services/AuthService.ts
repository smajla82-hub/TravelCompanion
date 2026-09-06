import {
    apiRequest,
    clearAuthToken,
    getAuthToken,
    setAuthToken,
} from "../api/client";

export type AuthUser = {
    id: string;
    email: string;
};

type AuthResponse = {
    token: string;
    user: AuthUser;
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

    async register(email: string, password: string) {
        const response = await apiRequest<AuthResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        setAuthToken(response.token);
        storeUser(response.user);
        return response.user;
    },

    logout() {
        clearAuthToken();
        localStorage.removeItem(USER_KEY);
    },
};
