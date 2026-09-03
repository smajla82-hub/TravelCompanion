const LEGACY_ACTIVITY_PREFIXES = [
    "🍳",
    "✈️",
    "✈",
    "🚗",
    "🛒",
    "🏨",
    "🏖️",
    "🏖",
] as const;

const LEGACY_ACTIVITY_PREFIX_PATTERN = new RegExp(
    `^(?:${LEGACY_ACTIVITY_PREFIXES.join("|")})\\s+`
);

/** Removes only known, former activity-icon prefixes from a title. */
export function normalizeActivityTitle(title: string): string {
    return title.replace(LEGACY_ACTIVITY_PREFIX_PATTERN, "");
}
