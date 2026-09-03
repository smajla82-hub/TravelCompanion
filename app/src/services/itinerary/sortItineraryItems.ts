import type { ItineraryItem } from "../../types";

const VALID_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function getTimeValue(time: string | undefined): number | undefined {
    if (!time || !VALID_TIME_PATTERN.test(time)) {
        return undefined;
    }

    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}

/** Returns a stable chronological ordering, with invalid times at the end. */
export function sortItineraryItems(
    items: ItineraryItem[]
): ItineraryItem[] {
    return items
        .map((item, index) => ({
            item,
            index,
            time: getTimeValue(item.time),
        }))
        .sort((left, right) => {
            if (left.time === undefined && right.time === undefined) {
                return left.index - right.index;
            }

            if (left.time === undefined) {
                return 1;
            }

            if (right.time === undefined) {
                return -1;
            }

            return left.time - right.time || left.index - right.index;
        })
        .map(({ item }) => item);
}
