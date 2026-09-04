import type { ItineraryItem } from "../types";

export type ItineraryItemTimingStatus =
    "past" | "current" | "next" | "upcoming";

type TimedItem = {
    id: string;
    time: Date;
};

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseItemTime(
    dayDate: string,
    time?: string
): Date | undefined {
    if (!time) {
        return undefined;
    }

    const cleaned = time.replace(/^[^\d]+/, "");

    const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);

    if (!match) {
        return undefined;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) {
        return undefined;
    }

    const [year, month, day] = dayDate
        .split("-")
        .map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(
        year,
        month - 1,
        day,
        hours,
        minutes
    );
}

export function getItineraryItemTimingStatuses(
    day: { date: string },
    items: ItineraryItem[],
    now: Date
): Record<string, ItineraryItemTimingStatus> {
    const isToday =
        formatLocalDate(now) === day.date;

    if (!isToday) {
        return {};
    }

    const timedItems: TimedItem[] = [];

    for (const item of items) {
        const parsedTime = parseItemTime(
            day.date,
            item.time
        );

        if (!parsedTime) {
            continue;
        }

        timedItems.push({
            id: item.id,
            time: parsedTime,
        });
    }

    timedItems.sort(
        (a, b) => a.time.getTime() - b.time.getTime()
    );

    let currentIndex = -1;

    for (let index = 0; index < timedItems.length; index++) {
        if (timedItems[index].time.getTime() <= now.getTime()) {
            currentIndex = index;
        }
    }

    const nextIndex =
        currentIndex + 1 < timedItems.length
            ? currentIndex + 1
            : -1;

    const statuses: Record<string, ItineraryItemTimingStatus> = {};

    for (let index = 0; index < timedItems.length; index++) {
        const id = timedItems[index].id;

        if (index === currentIndex) {
            statuses[id] = "current";
        } else if (index === nextIndex) {
            statuses[id] = "next";
        } else if (index < currentIndex) {
            statuses[id] = "past";
        } else {
            statuses[id] = "upcoming";
        }
    }

    return statuses;
}

/**
 * Returns only the activities that are still relevant for "today": the
 * current activity (as long as something is still upcoming after it),
 * the next/upcoming ones, and any activity whose time is missing or
 * invalid (which can't be classified as finished). Already finished
 * ("past") activities are dropped.
 *
 * There is no separate duration/end-time model: the timing statuses
 * always keep exactly one activity as "current" for the rest of the
 * day, even long after it started. Once nothing is left scheduled
 * after it (no "next"/"upcoming" activity), the day is effectively
 * over, so that trailing "current" activity is treated as finished
 * too — this is what allows the "all activities finished" empty state
 * to ever be reached.
 *
 * This is the pure logic backing the active day's "Show more" entry
 * point (`showRemainingOnly` on `ItineraryDayDetail`); it intentionally
 * does not decide *when* to apply the filter — callers only invoke it
 * for the active trip's active day.
 */
export function getRemainingItineraryItems<
    Item extends ItineraryItem
>(
    day: { date: string },
    items: Item[],
    now: Date
): Item[] {
    const statuses = getItineraryItemTimingStatuses(
        day,
        items,
        now
    );

    const hasUpcomingActivity = Object.values(statuses).some(
        status => status === "next" || status === "upcoming"
    );

    return items.filter(item => {
        const status = statuses[item.id];

        if (status === undefined) {
            return true;
        }

        if (status === "past") {
            return false;
        }

        if (status === "current") {
            return hasUpcomingActivity;
        }

        return true;
    });
}
