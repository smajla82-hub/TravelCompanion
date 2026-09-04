/**
 * Canonical Priority IDs and their semantic colors.
 *
 * This is the single source of truth for mapping a Priority value to the
 * CSS color variable used to highlight it across the app (activity
 * summaries, modals, etc). The mapping mirrors the color-coding used in the
 * source XLSX RoadBook so the in-app presentation stays recognizable.
 */
export const PRIORITY_IDS = [
    "MUST",
    "FOOD",
    "DRIVE",
    "OPTIONAL",
    "PHOTO",
    "SUNSET",
    "HOTEL",
    "BREAK",
    "EVENT",
] as const;

export type PriorityId = (typeof PRIORITY_IDS)[number];

/** Mandatory fallback color variable for missing or unknown Priority values. */
export const DEFAULT_PRIORITY_COLOR_VAR = "--color-text-secondary";

const PRIORITY_COLOR_VARS: Record<PriorityId, string> = {
    MUST: "--color-priority-must",
    FOOD: "--color-priority-food",
    DRIVE: "--color-priority-drive",
    OPTIONAL: "--color-priority-optional",
    PHOTO: "--color-priority-photo",
    SUNSET: "--color-priority-sunset",
    HOTEL: "--color-priority-hotel",
    BREAK: "--color-priority-break",
    EVENT: "--color-priority-event",
};

const PRIORITY_SET = new Set<string>(PRIORITY_IDS);

/**
 * Normalizes an arbitrary value (e.g. an XLSX cell or persisted field) into
 * a canonical Priority ID. Harmless formatting differences such as casing
 * and surrounding whitespace are normalized. Unknown or missing values
 * resolve to `undefined`.
 */
export function normalizePriority(
    value: string | null | undefined
): PriorityId | undefined {
    if (!value) {
        return undefined;
    }

    const normalized = value.trim().toUpperCase();

    if (PRIORITY_SET.has(normalized)) {
        return normalized as PriorityId;
    }

    return undefined;
}

/**
 * Returns the CSS variable name (e.g. "--color-priority-must") holding the
 * semantic color for a given Priority value. Falls back to the neutral
 * secondary text color for unknown or missing values.
 */
export function getPriorityColorVar(
    value: string | null | undefined
): string {
    const priority = normalizePriority(value);

    return priority
        ? PRIORITY_COLOR_VARS[priority]
        : DEFAULT_PRIORITY_COLOR_VAR;
}
