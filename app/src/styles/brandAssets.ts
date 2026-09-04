/**
 * Base-aware URLs for the branded app-shell artwork (Sprint 9.7).
 *
 * These live in `public/assets` so they must be resolved through
 * `import.meta.env.BASE_URL` (rather than a root-absolute path) to keep
 * working when the app is deployed under a sub-path, e.g. GitHub Pages'
 * `/TravelCompanion/`.
 */

const BASE_URL = import.meta.env.BASE_URL;

export const TOP_BACKGROUND_URL = `${BASE_URL}assets/top-background.webp`;
export const HERO_BACKGROUND_URL = `${BASE_URL}assets/hero-background.webp`;
export const BOTTOM_NAV_BACKGROUND_URL = `${BASE_URL}assets/bottom-nav-background.webp`;
