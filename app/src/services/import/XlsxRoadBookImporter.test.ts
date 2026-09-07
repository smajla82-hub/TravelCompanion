import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { importXlsxRoadBook } from "./XlsxRoadBookImporter";
import { sortItineraryItems } from "../itinerary/sortItineraryItems";

function buildWorkbookFile(rows: (string | number)[][]): File {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, sheet, "Day 1 - Test");

    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
    });

    return new File([buffer], "roadbook.xlsx");
}

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

function buildRows(
    dataRows: (string | number)[][]
): (string | number)[][] {
    return [
        ["Day 1 - Test"],
        ["10.9.2026 Thursday"],
        [],
        [],
        HEADER_ROW,
        ...dataRows,
    ];
}

describe("importXlsxRoadBook", () => {
    it("reads Activity Type directly from the corresponding column without changing the title", async () => {
        const file = buildWorkbookFile(
            buildRows([
                [
                    "7:00",
                    "🏖️ Main Beach",
                    "Laguna Beach",
                    "nature",
                    "MUST",
                ],
            ])
        );

        const { days } = await importXlsxRoadBook(file);

        expect(days).toHaveLength(1);
        expect(days[0].items).toHaveLength(1);

        const item = days[0].items[0];

        expect(item.title).toBe("🏖️ Main Beach");
        expect(item.activityType).toBe("nature");
        expect(item.priority).toBe("MUST");
    });

    it("normalizes casing/whitespace of the Activity Type column", async () => {
        const file = buildWorkbookFile(
            buildRows([
                ["9:00", "Scenic drive", "", "  SCENIC  ", "SUNSET"],
            ])
        );

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].items[0].activityType).toBe("scenic");
    });

    it("resolves an unknown Activity Type to 'other' without crashing", async () => {
        const file = buildWorkbookFile(
            buildRows([
                ["9:00", "Mystery activity", "", "unicorn", "OPTIONAL"],
            ])
        );

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].items[0].activityType).toBe("other");
    });

    it("resolves a missing Activity Type value to 'other'", async () => {
        const file = buildWorkbookFile(
            buildRows([["9:00", "No type activity", "", "", "MUST"]])
        );

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].items[0].activityType).toBe("other");
    });

    it("keeps Priority independent from Activity Type", async () => {
        const file = buildWorkbookFile(
            buildRows([
                ["7:00", "Breakfast", "", "food", "FOOD"],
                ["9:00", "Beach", "", "nature", "MUST"],
                ["11:00", "Overlook", "", "scenic", "SUNSET"],
            ])
        );

        const { days } = await importXlsxRoadBook(file);
        const [breakfast, beach, overlook] = days[0].items;

        expect(breakfast.activityType).toBe("food");
        expect(breakfast.priority).toBe("FOOD");

        expect(beach.activityType).toBe("nature");
        expect(beach.priority).toBe("MUST");

        expect(overlook.activityType).toBe("scenic");
        expect(overlook.priority).toBe("SUNSET");
    });

    it("does not populate the legacy goal field from the Activity Type column", async () => {
        const file = buildWorkbookFile(
            buildRows([["7:00", "Beach", "", "nature", "MUST"]])
        );

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].items[0].goal).toBeUndefined();
    });

    it("preserves user-entered emojis in activity titles", async () => {
        const file = buildWorkbookFile(
            buildRows([
                ["7:00", "🍳 Snídaně", "", "food", "FOOD"],
                ["9:00", "✈️ Odlet z Prahy", "", "flight", "MUST"],
                ["11:00", "🚗 Převzetí auta", "", "car_rental", "MUST"],
            ])
        );

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].items.map(item => item.title)).toEqual([
            "🍳 Snídaně",
            "✈️ Odlet z Prahy",
            "🚗 Převzetí auta",
        ]);
    });

    it("does not import a description field", async () => {
        const file = buildWorkbookFile(
            buildRows([["7:00", "Beach", "", "nature", "MUST", "", "", "", "Great spot"]])
        );

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].items[0].description).toBeUndefined();
        expect(days[0].items[0].note).toBe("Great spot");
    });

    it("skips an activity whose title exceeds the maximum length and reports a warning", async () => {
        const longTitle = "A".repeat(41);
        const file = buildWorkbookFile(
            buildRows([
                ["7:00", "Breakfast", "", "food", "FOOD"],
                ["9:00", longTitle, "", "nature", "MUST"],
            ])
        );

        const { days, warnings } = await importXlsxRoadBook(file);

        expect(days[0].items).toHaveLength(1);
        expect(days[0].items[0].title).toBe("Breakfast");

        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatchObject({
            day: "DAY 1",
            field: "Title",
            actualLength: 41,
            maxLength: 40,
        });
        expect(warnings[0].row).toBeGreaterThan(0);
    });

    it("skips an activity whose location exceeds the maximum length without failing the whole import", async () => {
        const longLocation = "L".repeat(27);
        const file = buildWorkbookFile(
            buildRows([
                ["7:00", "Beach", longLocation, "nature", "MUST"],
                ["9:00", "Museum", "Old Town", "culture", "OPTIONAL"],
            ])
        );

        const { days, warnings } = await importXlsxRoadBook(file);

        expect(days[0].items).toHaveLength(1);
        expect(days[0].items[0].title).toBe("Museum");

        expect(warnings).toHaveLength(1);
        expect(warnings[0].field).toBe("Location");
        expect(warnings[0].actualLength).toBe(27);
        expect(warnings[0].maxLength).toBe(26);
    });

    it("normalizes H:mm:ss time strings to canonical HH:mm", async () => {
        const file = buildWorkbookFile(
            buildRows([
                ["7:00:00", "Early start", "", "other", "MUST"],
                ["9:35:00", "Morning stop", "", "other", "MUST"],
                ["10:30:00", "Late morning", "", "other", "MUST"],
                ["12:15:00", "Lunch", "", "food", "MUST"],
            ])
        );

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].items.map(item => item.time)).toEqual([
            "07:00",
            "09:35",
            "10:30",
            "12:15",
        ]);
    });

    it("normalizes Excel time-serial cells to canonical HH:mm", async () => {
        // Real workbooks store times as numbers with a time number
        // format; SheetJS then hands the importer strings such as
        // "7:00:00" (formatted) or raw serials, depending on options.
        const rows = buildRows([
            ["7:00:00", "Early start", "", "other", "MUST"],
            ["9:35:00", "Morning stop", "", "other", "MUST"],
        ]);
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        const serials = [7 / 24, 0.3993055555555556 /* 09:35 */];

        serials.forEach((serial, index) => {
            const address = XLSX.utils.encode_cell({
                r: 5 + index,
                c: 0,
            });

            sheet[address] = { t: "n", v: serial, z: "h:mm:ss" };
        });

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, sheet, "Day 1 - Test");

        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });
        const file = new File([buffer], "roadbook.xlsx");

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].items.map(item => item.time)).toEqual([
            "07:00",
            "09:35",
        ]);
    });

    it("keeps invalid or missing imported times untimed", async () => {
        const file = buildWorkbookFile(
            buildRows([
                ["~16:30", "Flexible stop", "", "other", "OPTIONAL"],
                ["", "No time yet", "", "other", "OPTIONAL"],
                ["not a time", "Broken cell", "", "other", "OPTIONAL"],
            ])
        );

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].items.map(item => item.time)).toEqual([
            "",
            "",
            "",
        ]);
    });

    it("imports times that sort chronologically with the domain comparator", async () => {
        const file = buildWorkbookFile(
            buildRows([
                ["12:15:00", "Lunch", "", "food", "MUST"],
                ["7:00:00", "Early start", "", "other", "MUST"],
                ["10:30:00", "Late morning", "", "other", "MUST"],
                ["9:35:00", "Morning stop", "", "other", "MUST"],
                ["", "Untimed", "", "other", "OPTIONAL"],
            ])
        );

        const { days } = await importXlsxRoadBook(file);
        const sorted = sortItineraryItems(days[0].items);

        expect(sorted.map(item => item.title)).toEqual([
            "Early start",
            "Morning stop",
            "Late morning",
            "Lunch",
            "Untimed",
        ]);
        expect(sorted.map(item => item.time)).toEqual([
            "07:00",
            "09:35",
            "10:30",
            "12:15",
            "",
        ]);
    });
});
