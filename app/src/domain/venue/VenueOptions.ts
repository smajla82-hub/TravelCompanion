/**
 * Controlled option lists for `RecommendedVenue.mealType` and
 * `RecommendedVenue.subtype`.
 *
 * These lists were verified against `XlsxRoadBookImporter.ts`'s `parseVenues`
 * and the real "BlizzCon 2026 plan.xlsx" RoadBook sample data:
 * - Excel "Typ" -> `mealType` (and is mirrored verbatim into the legacy
 *   `type` field). Every sample row's "Typ" cell is one of Breakfast, Lunch,
 *   Dinner or CoffeeBreak.
 * - Excel venue-section "Poznámka" -> `subtype`. This is a separate mapping
 *   from the Activity-row "Poznámka" column (which feeds `ItineraryItem.note`
 *   instead) - same header text, different sheet section, different domain
 *   field.
 *
 * Both fields are presented as closed dropdowns with an explicit "Other"
 * fallback so a custom value can always be entered without discarding
 * whatever was imported/typed.
 */

export const OTHER_OPTION = "Other";

/** Controlled `RecommendedVenue.mealType` options. Plane/Airport intentionally excluded - see module doc. */
export const MEAL_TYPE_OPTIONS = [
    "Breakfast",
    "Lunch",
    "Dinner",
    "CoffeeBreak",
    OTHER_OPTION,
] as const;

export type MealTypeOption = (typeof MEAL_TYPE_OPTIONS)[number];

/** Controlled `RecommendedVenue.subtype` options (sourced from venue-section "Poznámka"). */
export const VENUE_SUBTYPE_OPTIONS = [
    "Airport",
    "Plane",
    "Pizza",
    "Burger",
    "Sandwich",
    "Italská",
    "Mexická",
    "Kuřecí",
    "Hot Dog",
    "Steakhouse",
    "Sushi",
    "Seafood",
    "Rooftop / Bar",
    "Philly Cheesesteak",
    "American",
    "Kavárna",
    "Restaurace",
    "Snack",
    OTHER_OPTION,
] as const;

export type VenueSubtypeOption = (typeof VENUE_SUBTYPE_OPTIONS)[number];

/**
 * Resolves the `<select>` value for a stored field value: the value itself
 * when it matches one of the controlled options, or "Other" when it is
 * missing/unknown so a legacy or freshly imported value is never silently
 * discarded or coerced into the wrong option.
 */
export function resolveControlledOption<T extends string>(
    options: readonly T[],
    value: string | undefined
): T | typeof OTHER_OPTION {
    if (value && (options as readonly string[]).includes(value)) {
        return value as T;
    }

    return OTHER_OPTION;
}

/** Whether `value` is the literal "Other" marker used by these controlled selects. */
export function isOtherOption(value: string | undefined): boolean {
    return value === OTHER_OPTION;
}
