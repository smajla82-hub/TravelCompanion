import type { IconName } from "../../components/ui/icon";

/**
 * Canonical Activity Type IDs.
 *
 * This is the single source of truth for the Activity Type system.
 * XLSX RoadBook imports, persisted ItineraryItem data, and the UI icon
 * mapping must all derive from this list.
 */
export const ACTIVITY_TYPE_IDS = [
    "food",
    "flight",
    "transport",
    "scenic",
    "nature",
    "walk",
    "sightseeing",
    "event",
    "shopping",
    "accommodation",
    "parking",
    "car_rental",
    "travel_prep",
    "airport",
    "rest",
    "other",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPE_IDS)[number];

/** Mandatory fallback for missing or unknown Activity Type values. */
export const DEFAULT_ACTIVITY_TYPE: ActivityType = "other";

export type ActivityTypeDefinition = {
    id: ActivityType;
    label: string;
    icon: IconName;
};

export const ACTIVITY_TYPE_REGISTRY: Record<
    ActivityType,
    ActivityTypeDefinition
> = {
    food: { id: "food", label: "Food", icon: "utensils" },
    flight: { id: "flight", label: "Flight", icon: "plane" },
    transport: { id: "transport", label: "Transport", icon: "car" },
    scenic: { id: "scenic", label: "Scenic", icon: "mountainSnow" },
    nature: { id: "nature", label: "Nature", icon: "trees" },
    walk: { id: "walk", label: "Walk", icon: "footprints" },
    sightseeing: {
        id: "sightseeing",
        label: "Sightseeing",
        icon: "landmark",
    },
    event: { id: "event", label: "Event", icon: "calendarDays" },
    shopping: { id: "shopping", label: "Shopping", icon: "shoppingBag" },
    accommodation: {
        id: "accommodation",
        label: "Accommodation",
        icon: "bedDouble",
    },
    parking: { id: "parking", label: "Parking", icon: "squareParking" },
    car_rental: { id: "car_rental", label: "Car Rental", icon: "key" },
    travel_prep: {
        id: "travel_prep",
        label: "Travel Prep",
        icon: "luggage",
    },
    airport: { id: "airport", label: "Airport", icon: "idCard" },
    rest: { id: "rest", label: "Rest", icon: "moon" },
    other: { id: "other", label: "Other", icon: "circleEllipsis" },
};

const ACTIVITY_TYPE_SET = new Set<string>(ACTIVITY_TYPE_IDS);

/**
 * Normalizes an arbitrary value (e.g. an XLSX cell or persisted field) into
 * a canonical ActivityType. Harmless formatting differences such as casing
 * and surrounding whitespace are normalized. Unknown or missing values
 * safely resolve to the "other" fallback.
 */
export function normalizeActivityType(
    value: string | null | undefined
): ActivityType {
    if (!value) {
        return DEFAULT_ACTIVITY_TYPE;
    }

    const normalized = value.trim().toLowerCase();

    if (ACTIVITY_TYPE_SET.has(normalized)) {
        return normalized as ActivityType;
    }

    return DEFAULT_ACTIVITY_TYPE;
}

/** Returns the UI metadata (label, icon) for a given Activity Type. */
export function getActivityTypeDefinition(
    activityType: string | null | undefined
): ActivityTypeDefinition {
    return ACTIVITY_TYPE_REGISTRY[normalizeActivityType(activityType)];
}
