export type Theme =
    | "light"
    | "dark";

const STORAGE_KEY =
    "travel-companion.theme";

function isTheme(value: string | null): value is Theme {
    return value === "light" || value === "dark";
}

export const ThemeService = {

    getTheme(): Theme {
        const stored =
            localStorage.getItem(STORAGE_KEY);

        if (isTheme(stored)) {
            return stored;
        }

        return "light";
    },

    applyTheme(theme: Theme) {
        document.documentElement.setAttribute(
            "data-theme",
            theme
        );
    },

    setTheme(theme: Theme) {
        localStorage.setItem(
            STORAGE_KEY,
            theme
        );

        this.applyTheme(theme);
    },

    applyStoredTheme() {
        this.applyTheme(
            this.getTheme()
        );
    },

};
