/**
 * Base-aware URLs for the branded app-shell artwork (Sprint 9.7).
 *
 * These live in `public/assets` so they must be resolved through
 * `import.meta.env.BASE_URL` (rather than a root-absolute path) to keep
 * working when the app is deployed under a sub-path, e.g. GitHub Pages'
 * `/TravelCompanion/`.
 */

const BASE_URL = import.meta.env.BASE_URL;

export function resolveBrandAssetUrl(baseUrl: string, fileName: string) {
    return `${baseUrl.replace(/\/?$/, "/")}assets/${fileName}`;
}

export const TOP_BACKGROUND_URL = resolveBrandAssetUrl(BASE_URL, "top-background800x800.webp");
export const HERO_BACKGROUND_URL = resolveBrandAssetUrl(BASE_URL, "hero-background1200x600.webp");
export const BOTTOM_NAV_BACKGROUND_URL = resolveBrandAssetUrl(BASE_URL, "bottom-nav-background1200x300.webp");
export const TRIPS_BACKGROUND_URL = resolveBrandAssetUrl(BASE_URL, "trips_background_1440x3200.webp");
export const SETTINGS_BACKGROUND_URL = resolveBrandAssetUrl(BASE_URL, "settings_background1440x3200.webp");
