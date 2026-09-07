/**
 * Single source of truth for the Recommended Venue / Parking Location
 * business rules (day-scoped):
 * - Maximum 6 Recommended Venues per day.
 * - Maximum 8 Parking Locations per day, using only codes P1-P8.
 * - No duplicate parking codes within the same day.
 *
 * These are hard product limits, not UI conveniences: both the offline
 * (`TripService`) and online (`server/src/repositories/tripRepository.js`)
 * write paths must enforce them, not just the UI. This module is the
 * client-side source of truth; the server mirrors the same constants and
 * rules (see `tripRepository.js`) since there is no shared runtime between
 * the browser and the Node server.
 */

export const MAX_VENUES_PER_DAY = 6;
export const MAX_PARKING_PER_DAY = 8;

/** The only valid parking codes. Never introduce P9+. */
export const PARKING_CODES = [
    "P1",
    "P2",
    "P3",
    "P4",
    "P5",
    "P6",
    "P7",
    "P8",
] as const;

export type ParkingCode = (typeof PARKING_CODES)[number];

export function isValidParkingCode(code: string | undefined | null): code is ParkingCode {
    return (PARKING_CODES as readonly string[]).includes(code ?? "");
}

export function canAddVenue(currentVenueCount: number): boolean {
    return currentVenueCount < MAX_VENUES_PER_DAY;
}

export function canAddParkingLocation(currentParkingCount: number): boolean {
    return currentParkingCount < MAX_PARKING_PER_DAY;
}

/** Parking codes not already used by another parking location in the same day. */
export function availableParkingCodes(
    existingCodes: readonly string[],
    keepCode?: string
): ParkingCode[] {
    const used = new Set(existingCodes.filter(code => code !== keepCode));

    return PARKING_CODES.filter(code => !used.has(code));
}

export function isDuplicateParkingCode(
    existingCodes: readonly string[],
    code: string,
    keepCode?: string
): boolean {
    return existingCodes.some(
        existing => existing === code && existing !== keepCode
    );
}
