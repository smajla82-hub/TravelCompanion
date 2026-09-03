export interface ItineraryItem {

    id: string;

    time?: string;

    title: string;

    description?: string;

    location?: string;

    /** @deprecated Superseded by `activityType`. Kept for backward compatibility with older persisted data. */
    goal?: string;

    /** Canonical Activity Type ID (see ActivityTypeRegistry). Missing/unknown values fall back to "other". */
    activityType?: string;

    priority?: string;

    parking?: string;

    smartChip?: string;

    mapLink?: string;

    price?: string;

    note?: string;

    date: string;

}