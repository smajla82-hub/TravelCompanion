import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { importXlsxRoadBook } from "./XlsxRoadBookImporter";

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
    it("reads Activity Type directly from the corresponding column", async () => {
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

        const days = await importXlsxRoadBook(file);

        expect(days).toHaveLength(1);
        expect(days[0].items).toHaveLength(1);

        const item = days[0].items[0];

        expect(item.title).toBe("Main Beach");
        expect(item.activityType).toBe("nature");
        expect(item.priority).toBe("MUST");
    });

    it("normalizes casing/whitespace of the Activity Type column", async () => {
        const file = buildWorkbookFile(
            buildRows([
                ["9:00", "Scenic drive", "", "  SCENIC  ", "SUNSET"],
            ])
        );

        const days = await importXlsxRoadBook(file);

        expect(days[0].items[0].activityType).toBe("scenic");
    });

    it("resolves an unknown Activity Type to 'other' without crashing", async () => {
        const file = buildWorkbookFile(
            buildRows([
                ["9:00", "Mystery activity", "", "unicorn", "OPTIONAL"],
            ])
        );

        const days = await importXlsxRoadBook(file);

        expect(days[0].items[0].activityType).toBe("other");
    });

    it("resolves a missing Activity Type value to 'other'", async () => {
        const file = buildWorkbookFile(
            buildRows([["9:00", "No type activity", "", "", "MUST"]])
        );

        const days = await importXlsxRoadBook(file);

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

        const days = await importXlsxRoadBook(file);
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

        const days = await importXlsxRoadBook(file);

        expect(days[0].items[0].goal).toBeUndefined();
    });
});
