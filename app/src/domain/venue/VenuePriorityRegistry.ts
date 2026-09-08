/**
 * Canonical `RecommendedVenue.priority` values and their semantic colors.
 *
 * This is the single source of truth for mapping a venue Priority value to
 * a controlled dropdown option ("Main"/"Backup") and to its display color,
 * mirroring the pattern used by `../activity/PriorityRegistry.ts` for
 * itinerary activities.
 *
 * The imported "BlizzCon 2026 plan.xlsx" RoadBook sample data encodes venue
 * priority as "⭐ Hlavní" (Main) or "🔄 Záložní" (Backup). `normalizeVenuePriority`
 * recognizes those Czech/emoji forms (and the plain "Main"/"Backup" values
 * saved by this app's own dropdown) so existing imported rows remain
 * compatible after this field became a controlled dropdown.
 */

export const VENUE_PRIORITY_MAIN = "Main";
export const VENUE_PRIORITY_BACKUP = "Backup";

export const VENUE_PRIORITY_OPTIONS = [
    VENUE_PRIORITY_MAIN,
    VENUE_PRIORITY_BACKUP,
] as const;

export type VenuePriorityOption = (typeof VENUE_PRIORITY_OPTIONS)[number];

/** Mandatory fallback color variable for missing or unrecognized Priority values. */
export const DEFAULT_VENUE_PRIORITY_COLOR_VAR = "--color-text-secondary";

const VENUE_PRIORITY_COLOR_VARS: Record<VenuePriorityOption, string> = {
    Main: "--color-venue-priority-main",
    Backup: "--color-venue-priority-backup",
};

const MAIN_PATTERN = /^main$|hlavn[ií]/i;
const BACKUP_PATTERN = /^backup$|z[aá]lo[zž]n[ií]/i;

/**
 * Resolves a raw stored/imported `priority` value (e.g. "Main", "⭐ Hlavní",
 * "🔄 Záložní") to the canonical `VenuePriorityOption`, or `undefined` when it
 * doesn't match either known form.
 */
export function normalizeVenuePriority(
    value: string | null | undefined
): VenuePriorityOption | undefined {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return undefined;
    }

    if (MAIN_PATTERN.test(trimmed)) {
        return VENUE_PRIORITY_MAIN;
    }

    if (BACKUP_PATTERN.test(trimmed)) {
        return VENUE_PRIORITY_BACKUP;
    }

    return undefined;
}

/**
 * Returns the CSS variable name (e.g. "--color-venue-priority-main") holding
 * the semantic color for a given venue Priority value. Falls back to the
 * neutral `DEFAULT_VENUE_PRIORITY_COLOR_VAR` for missing/unknown values.
 */
export function getVenuePriorityColorVar(
    value: string | null | undefined
): string {
    const priority = normalizeVenuePriority(value);

    return priority
        ? VENUE_PRIORITY_COLOR_VARS[priority]
        : DEFAULT_VENUE_PRIORITY_COLOR_VAR;
}
