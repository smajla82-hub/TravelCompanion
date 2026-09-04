import type { Trip } from "../types";

export function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/**
 * Mirrors the current-day logic used by CurrentActivityView: a day is
 * "active" only while the trip is in progress (today is within the
 * trip's start/end range) and its date matches today.
 */
export function isActiveItineraryDay(
    dayDate: string,
    trip: Pick<Trip, "startDate" | "endDate">,
    now: Date = new Date()
): boolean {
    const today = formatLocalDate(now);
    const startDate = trip.startDate.slice(0, 10);
    const endDate = trip.endDate.slice(0, 10);

    if (today < startDate || today > endDate) {
        return false;
    }

    return dayDate === today;
}
