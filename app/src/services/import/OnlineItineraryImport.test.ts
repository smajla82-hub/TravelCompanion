import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

vi.hoisted(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
        },
    });
});

import { importXlsxRoadBook } from "./XlsxRoadBookImporter";
import { TripService } from "../TripService";
import { createTripAdapter } from "../TripAdapter";
import { SyncedTripApi, type ItineraryDayPayload } from "../../api/trips";
import { ApiError } from "../../api/client";
import type { ItineraryItem, Trip } from "../../types";

const HEADER_ROW = [
    "Čas",
    "Aktivita",
    "Lokalita",
    "Activity Type",
    "Priorita",
    "🅿",
    "📍 Smart Chip",
    "💰 Cena",
    "Poznámka",
];

const TOO_LONG_TITLE = "x".repeat(200);

/** Two realistic RoadBook day sheets, including one invalid (too long) row. */
const DAY_SHEETS: { name: string; rows: (string | number)[][] }[] = [
    {
        name: "Day 1 - Arrival",
        rows: [
            ["Day 1 - Arrival", "", "", "", "", "", "", "", ""],
            ["10.9.2026 Thursday"],
            [],
            [],
            HEADER_ROW,
            ["7:00", "🥐 Breakfast", "Hotel Garda", "food", "MUST", "P1", "Hotel Garda", "20 EUR", "Buffet included"],
            ["9:30", "🏖️ Main Beach", "Laguna Beach", "nature", "OPTIONAL", "P2", "Laguna Beach", "", "Towels needed"],
            ["12:00", TOO_LONG_TITLE, "Nowhere", "food", "MUST", "", "", "", ""],
            ["18:00", "🍝 Dinner", "Trattoria", "food", "MUST", "", "Trattoria", "35 EUR", "Book a table"],
        ],
    },
    {
        name: "Day 2 - Departure",
        rows: [
            ["Day 2 - Departure", "", "", "", "", "", "", "", ""],
            ["11.9.2026 Friday"],
            [],
            [],
            HEADER_ROW,
            ["8:00", "🚗 Drive home", "Riva del Garda", "transfer", "MUST", "", "Riva del Garda", "", ""],
        ],
    },
];

function buildRoadBookFile(): File {
    const workbook = XLSX.utils.book_new();

    for (const { name, rows } of DAY_SHEETS) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new File([buffer], "roadbook.xlsx");
}

/** Itinerary content that has to be identical for offline and online Trips. */
function comparableItem(item: Omit<ItineraryItem, "id">) {
    return {
        date: item.date,
        time: item.time,
        title: item.title,
        location: item.location,
        activityType: item.activityType,
        priority: item.priority,
        parking: item.parking,
        smartChip: item.smartChip,
        mapLink: item.mapLink,
        price: item.price,
        note: item.note,
    };
}

function comparableDays(days: {
    date: string;
    title: string;
    items: Omit<ItineraryItem, "id">[];
    venues?: unknown[];
    parkingLocations?: unknown[];
}[]) {
    return days.map(day => ({
        date: day.date,
        title: day.title,
        items: day.items.map(comparableItem),
        venues: day.venues,
        parkingLocations: day.parkingLocations,
    }));
}

function onlineTrip(id: string): Pick<Trip, "id" | "source"> {
    return { id, source: "online" };
}

describe("RoadBook import into online Trips", () => {
    beforeEach(() => {
        vi.spyOn(SyncedTripApi, "acquireLock").mockResolvedValue({});
        vi.spyOn(SyncedTripApi, "releaseLock").mockResolvedValue({});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        TripService.getAll()
            .filter(trip => trip.id.startsWith("import-test-"))
            .forEach(trip => TripService.delete(trip.id));
    });

    it("sends every imported day and activity in a single itinerary request", async () => {
        const { days, warnings } = await importXlsxRoadBook(buildRoadBookFile());
        const replaceItinerary = vi.spyOn(SyncedTripApi, "replaceItinerary")
            .mockResolvedValue({ tripId: "trip-1", days: [] });
        const createDay = vi.spyOn(SyncedTripApi, "createDay");
        const createItem = vi.spyOn(SyncedTripApi, "createItem");

        await createTripAdapter(onlineTrip("trip-1")).setItinerary(days);

        expect(replaceItinerary).toHaveBeenCalledTimes(1);
        expect(createDay).not.toHaveBeenCalled();
        expect(createItem).not.toHaveBeenCalled();

        const [, sentDays] = replaceItinerary.mock.calls[0] as [string, ItineraryDayPayload[]];

        // The 9.6 validation behaviour is unchanged: the over-long row is
        // skipped with a warning and every valid row is still imported.
        expect(warnings).toHaveLength(1);
        expect(sentDays.map(day => day.date)).toEqual(["2026-09-10", "2026-09-11"]);
        expect(sentDays.map(day => day.title)).toEqual(["Day 1 - Arrival", "Day 2 - Departure"]);
        expect(sentDays[0].items.map(item => item.title)).toEqual([
            "🥐 Breakfast",
            "🏖️ Main Beach",
            "🍝 Dinner",
        ]);
        expect(sentDays[0].items.map(item => item.sortOrder)).toEqual([0, 1, 2]);
        expect(sentDays[1].items.map(item => item.title)).toEqual(["🚗 Drive home"]);
        expect(sentDays[0].items.every(item => !("id" in item))).toBe(true);

        expect(sentDays[0].items[0]).toMatchObject({
            date: "2026-09-10",
            // Imported times are normalized to canonical HH:mm at the
            // XLSX boundary before the itinerary is sent to the server.
            time: "07:00",
            title: "🥐 Breakfast",
            location: "Hotel Garda",
            activityType: "food",
            priority: "MUST",
            parking: "P1",
            smartChip: "Hotel Garda",
            price: "20 EUR",
            note: "Buffet included",
        });
    });

    it("produces the same itinerary data for offline and online Trips", async () => {
        const { days } = await importXlsxRoadBook(buildRoadBookFile());

        TripService.add({
            id: "import-test-local",
            destination: "Garda",
            country: "Italy",
            startDate: "2026-09-10",
            endDate: "2026-09-11",
            travellers: 2,
            status: "planning",
        });
        await createTripAdapter({ id: "import-test-local", source: "local" }).setItinerary(days);

        const replaceItinerary = vi.spyOn(SyncedTripApi, "replaceItinerary")
            .mockResolvedValue({ tripId: "trip-1", days: [] });
        await createTripAdapter(onlineTrip("trip-1")).setItinerary(days);

        const offlineDays = TripService.getAll()
            .find(trip => trip.id === "import-test-local")?.itinerary ?? [];
        const [, sentDays] = replaceItinerary.mock.calls[0] as [string, ItineraryDayPayload[]];

        expect(comparableDays(offlineDays)).toEqual(comparableDays(sentDays));
    });

    it("reports a failing itinerary request instead of a successful import", async () => {
        const { days } = await importXlsxRoadBook(buildRoadBookFile());
        vi.spyOn(SyncedTripApi, "replaceItinerary")
            .mockRejectedValue(new ApiError("Itinerary item title is required.", { status: 400 }));

        await expect(createTripAdapter(onlineTrip("trip-1")).setItinerary(days))
            .rejects.toThrow("Itinerary item title is required.");

        expect(SyncedTripApi.releaseLock).toHaveBeenCalledWith("trip-1");
    });
});
