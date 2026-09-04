/**
 * Single source of truth for maximum text lengths used across the app.
 *
 * These limits are shared by the Add/Edit Activity form, the Trip and Day
 * forms, and the XLSX importer so that the same rules apply everywhere
 * user-facing free text is entered or imported.
 */
export const TEXT_LIMITS = {
    tripName: 40,
    dayTitle: 40,
    activityTitle: 40,
    location: 26,
    price: 26,
    note: 60,
    mapLink: 2048,
} as const;

export type TextLimitField = keyof typeof TEXT_LIMITS;

/** Human-readable labels for reporting purposes (e.g. import warnings). */
export const TEXT_LIMIT_LABELS: Record<TextLimitField, string> = {
    tripName: "Trip Name",
    dayTitle: "Day Title",
    activityTitle: "Title",
    location: "Location",
    price: "Price",
    note: "Note",
    mapLink: "Map Link",
};

/** Returns the length that should be compared against the limit. */
export function getTextLength(value: string | undefined | null): number {
    return (value ?? "").length;
}

/** Returns true when `value` is longer than the maximum allowed for `field`. */
export function exceedsTextLimit(
    value: string | undefined | null,
    field: TextLimitField
): boolean {
    return getTextLength(value) > TEXT_LIMITS[field];
}

/** Renders a compact "current / maximum" character counter, e.g. "26 / 40". */
export function formatCharacterCounter(
    value: string | undefined | null,
    field: TextLimitField
): string {
    return `${getTextLength(value)} / ${TEXT_LIMITS[field]}`;
}

/** CSS class name for a character counter, flagging when the limit is exceeded. */
export function counterClassName(
    value: string | undefined | null,
    field: TextLimitField
): string {
    return exceedsTextLimit(value, field)
        ? "tc-char-counter tc-char-counter--exceeded"
        : "tc-char-counter";
}
