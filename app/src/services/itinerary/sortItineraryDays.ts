import type { ItineraryDay } from "../../types";

export function sortItineraryDays(
    days: ItineraryDay[]
): ItineraryDay[] {
    return [...days].sort((left, right) =>
        left.date.localeCompare(right.date)
    );
}
