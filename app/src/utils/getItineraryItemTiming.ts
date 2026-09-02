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
