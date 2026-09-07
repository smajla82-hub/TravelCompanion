/**
 * Single source of truth for normalizing imported/user-facing itinerary
 * times to the canonical internal format `HH:mm` (24-hour, zero-padded).
 *
 * The rest of the domain (itinerary sorting, timing status, and the
 * Activity form's `input[type="time"]`) relies on `ItineraryItem.time`
 * being canonical `HH:mm`, so every entry point that accepts external
 * time values — first of all the XLSX RoadBook importer — must run them
 * through this function. Anything that cannot be interpreted as a valid
 * wall-clock time normalizes to "" (untimed) rather than an invalid
 * string.
 */

const MINUTES_PER_DAY = 24 * 60;
const EXCEL_SERIAL_FRACTION_EPSILON = 1e-9;

function fromHoursAndMinutes(
    hours: number,
    minutes: number
): string {
    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return "";
    }

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
    ].join(":");
}

/**
 * Accepts `H:mm`, `HH:mm`, `H:mm:ss` and `HH:mm:ss`, optionally followed
 * by an AM/PM designator (e.g. "7:00", "07:00:00", "9:35 PM"). Anything
 * else — including approximate markers such as "~16:30" — is not a valid
 * canonical time and returns "".
 */
function fromString(text: string): string {
    const match = text.match(
        /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AaPp])\.?[Mm]?\.?)?$/
    );

    if (!match) {
        return "";
    }

    const [, hoursText, minutesText, , ampm] = match;

    let hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (ampm !== undefined) {
        if (hours < 1 || hours > 12) {
            return "";
        }

        const isPm = ampm.toLowerCase() === "p";

        hours = (hours % 12) + (isPm ? 12 : 0);
    }

    return fromHoursAndMinutes(hours, minutes);
}

/**
 * Converts an Excel time serial (fraction of a day, e.g. 0.29166… for
 * 07:00) to `HH:mm`, rounding to the nearest minute. Values outside a
 * single day — including dates with a day component — are not plain
 * times.
 */
function fromExcelTimeSerial(value: number): string {
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
        return "";
    }

    const exactMinutes = value * MINUTES_PER_DAY;
    const fraction = exactMinutes % 1;

    // Guard against float noise such as 0.3993055555555556 (09:35),
    // while rejecting serials that are not whole minutes.
    if (
        fraction > EXCEL_SERIAL_FRACTION_EPSILON &&
        fraction < 1 - EXCEL_SERIAL_FRACTION_EPSILON
    ) {
        return "";
    }

    const totalMinutes = Math.round(exactMinutes);

    if (totalMinutes >= MINUTES_PER_DAY) {
        return "";
    }

    return fromHoursAndMinutes(
        Math.floor(totalMinutes / 60),
        totalMinutes % 60
    );
}

/**
 * Reads the wall-clock time of a Date in UTC; SheetJS `cellDates: true`
 * produces UTC-based Date instances for time cells.
 */
function fromDate(date: Date): string {
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return fromHoursAndMinutes(
        date.getUTCHours(),
        date.getUTCMinutes()
    );
}

/**
 * Normalizes an imported or user-facing itinerary time to canonical
 * `HH:mm`. Returns "" for missing/invalid values so untimed activities
 * stay untimed instead of carrying a malformed time string.
 */
export function normalizeItineraryTime(
    value: string | number | boolean | Date | null | undefined
): string {
    if (value === null || value === undefined) {
        return "";
    }

    if (value instanceof Date) {
        return fromDate(value);
    }

    if (typeof value === "number") {
        return fromExcelTimeSerial(value);
    }

    if (typeof value !== "string") {
        return "";
    }

    return fromString(value.trim());
}
