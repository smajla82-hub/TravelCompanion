import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import { importXlsxRoadBook } from "./XlsxRoadBookImporter";
import { sortItineraryItems } from "../itinerary/sortItineraryItems";

type SheetSpec = {
    name: string;
    rows: (string | number)[][];
    links?: {
        row: number;
        column: number;
        target: string;
    }[];
};

function buildWorkbookFile(
    rowsOrSheets: (string | number)[][] | SheetSpec[]
): File {
    const sheets: SheetSpec[] =
        Array.isArray(rowsOrSheets[0]) ?
            [{
                name: "Day 1 - Test",
                rows: rowsOrSheets as (string | number)[][],
            }] :
            rowsOrSheets as SheetSpec[];

    const workbook = XLSX.utils.book_new();

    for (const { name, rows, links = [] } of sheets) {
        const sheet = XLSX.utils.aoa_to_sheet(rows);

        for (const link of links) {
            const address = XLSX.utils.encode_cell({
                r: link.row,
                c: link.column,
            });

            sheet[address] = {
                ...(sheet[address] ?? { t: "s", v: "" }),
                l: { Target: link.target },
            };
        }

        XLSX.utils.book_append_sheet(workbook, sheet, name);
    }

    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
    });

    return new File([buffer], "roadbook.xlsx");
}

async function readFixtureFile(filename: string): Promise<File> {
    const fixturePath = resolve("..", filename);
    const buffer = await readFile(fixturePath);

    return new File([new Uint8Array(buffer)], basename(fixturePath));
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

const CANONICAL_HEADER_ROW = [
    "Time🕒 ",
    "Activity 🗓",
    "Location 🌍",
    "Activity Type",
    "Priority ⭐",
    "Parking 🚗",
    "Place Name 📍 (Smart Chip)",
    "Price 💰",
    "Note📝",
];

const CANONICAL_VENUE_PARKING_HEADER_ROW = [
    "Priority ⭐",
    "Meal Type 🍴",
    "Place 🌍",
    "Place Name 📍 (Smart Chip)",
    "Recommendation 💡",
    "Price/person 💰",
    "Parking 🚗",
    "Reservation ⏰",
    "Note📝",
    "",
    "",
    "Code",
    "Location 🌍",
    "Place Name 📍 (Smart Chip)",
    "Price 💰",
    "Note📝",
];

function buildCanonicalRows(
    dataRows: (string | number)[][],
    venueParkingRows: (string | number)[][] = [],
    statsRows: (string | number)[][] = []
): (string | number)[][] {
    const rows: (string | number)[][] = [
        ["🧳 DAY X – Example"],
        ["Neděle • 1. 1. 2020"],
        [],
        ["🗓 ČASOVÁ OSA + 🚗 PARKOVÁNÍ", "", "", "", "", "", "", "", "", "", "", "STATISTICS 📊"],
        CANONICAL_HEADER_ROW,
        ...dataRows,
        [],
    ];

    if (statsRows.length > 0) {
        for (let index = 0; index < statsRows.length; index++) {
            const row = rows[4 + index] ?? [];

            rows[4 + index] = row;
            row[11] = statsRows[index][0];
            row[12] = statsRows[index][1];
        }
    }

    rows.push(
        ["🍴 DOPORUČENÉ PODNIKY", "", "", "", "", "", "", "", "", "", "", "PARKING 🚗"],
        CANONICAL_VENUE_PARKING_HEADER_ROW,
        ...venueParkingRows
    );

    return rows;
}

describe("importXlsxRoadBook", () => {
    it("imports the MASTER_TEMPLATE v4.3 Day sheet without CONFIG and ignores its instruction sheet", async () => {
        const file = await readFixtureFile("MASTER_TEMPLATE_V_4.3.xlsx");

        const { days } = await importXlsxRoadBook(file);

        expect(days).toHaveLength(1);
        expect(days[0]).toMatchObject({
            date: "2020-01-01",
            title: "🧳 DAY X – Example",
        });
    });

    it("imports canonical v4.3 activity, venue, parking, Smart Chip links, and statistics", async () => {
        const activityLink = "https://maps.example/activity";
        const venueLink = "https://maps.example/venue";
        const parkingLink = "https://maps.example/parking";
        const rows = buildCanonicalRows(
            [
                [
                    "7:00:00",
                    "Breakfast",
                    "Anaheim",
                    "food",
                    "MUST",
                    "P1",
                    "Breakfast Smart Place",
                    "15 USD",
                    "Morning note",
                ],
                [
                    "9:30:00",
                    "Museum",
                    "Los Angeles",
                    "culture",
                    "OPTIONAL",
                    "",
                    "Museum Smart Place",
                    "20 USD",
                    "Museum note",
                ],
            ],
            [[
                "⭐ Hlavní",
                "🍳Breakfast",
                "Venue display name",
                "Venue Smart Place",
                "Great breakfast",
                "15–20 USD",
                "P1",
                "No",
                "Airport",
                "",
                "",
                "P1",
                "Parking display name",
                "Parking Smart Place",
                "10 USD/day",
                "Covered lot",
            ]],
            [
                ["🚗 Celkem km", "~60 km"],
                ["🍽 Podniky", "1"],
            ]
        );
        const file = buildWorkbookFile([{
            name: "Day 1 - Canonical",
            rows,
            links: [
                { row: 5, column: 6, target: activityLink },
                { row: 10, column: 3, target: venueLink },
                { row: 10, column: 13, target: parkingLink },
            ],
        }]);

        const { days } = await importXlsxRoadBook(file);
        const day = days[0];

        expect(day.items).toHaveLength(2);
        expect(day.items[0]).toMatchObject({
            time: "07:00",
            title: "Breakfast",
            location: "Anaheim",
            activityType: "food",
            priority: "MUST",
            parking: "P1",
            smartChip: "Breakfast Smart Place",
            mapLink: activityLink,
            price: "15 USD",
            note: "Morning note",
        });
        expect(day.venues).toEqual([
            expect.objectContaining({
                priority: "⭐ Hlavní",
                type: "🍳Breakfast",
                mealType: "🍳Breakfast",
                name: "Venue display name",
                smartChip: "Venue Smart Place",
                mapLink: venueLink,
                recommendation: "Great breakfast",
                price: "15–20 USD",
                parking: "P1",
                reservation: "No",
                subtype: "Airport",
            }),
        ]);
        expect(day.parkingLocations).toEqual([
            expect.objectContaining({
                code: "P1",
                name: "Parking display name",
                mapLink: parkingLink,
                price: "10 USD/day",
                note: "Covered lot",
            }),
        ]);
        expect(day.stats).toEqual([
            { label: "🚗 Celkem km", value: "~60 km" },
            { label: "🍽 Podniky", value: "1" },
        ]);
    });

    it("imports multiple Day sheets using canonical v4.3 headers", async () => {
        const firstDayRows = buildCanonicalRows([
            ["7:00", "First day activity", "", "other", "MUST"],
        ]);
        const secondDayRows = buildCanonicalRows([
            ["8:00", "Second day activity", "", "other", "OPTIONAL"],
        ]);

        secondDayRows[0][0] = "🧳 DAY Y – Example";
        secondDayRows[1][0] = "Pondělí • 2. 1. 2020";

        const file = buildWorkbookFile([
            { name: "Day 1", rows: firstDayRows },
            { name: "Day 2", rows: secondDayRows },
        ]);

        const { days } = await importXlsxRoadBook(file);

        expect(days).toHaveLength(2);
        expect(days.map(day => day.date)).toEqual([
            "2020-01-01",
            "2020-01-02",
        ]);
        expect(days.map(day => day.items[0].title)).toEqual([
            "First day activity",
            "Second day activity",
        ]);
    });

    it("keeps canonical venue and parking columns scoped when shared headers collide", async () => {
        const rows = buildCanonicalRows(
            [["7:00", "Activity", "", "other", "MUST"]],
            [[
                "Main",
                "Dinner",
                "Venue name",
                "Venue chip",
                "Recommendation",
                "Venue price",
                "P2",
                "Required",
                "Venue note",
                "",
                "",
                "P2",
                "Parking name",
                "Parking chip",
                "Parking price",
                "Parking note",
            ]]
        );
        const file = buildWorkbookFile(rows);

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].venues?.[0]).toMatchObject({
            name: "Venue name",
            smartChip: "Venue chip",
            price: "Venue price",
            subtype: "Venue note",
        });
        expect(days[0].parkingLocations?.[0]).toMatchObject({
            name: "Parking name",
            price: "Parking price",
            note: "Parking note",
        });
    });

    it("keeps the legacy BlizzCon RoadBook multi-day import functional while ignoring non-Day sheets", async () => {
        const file = await readFixtureFile("BlizzCon 2026 plan.xlsx");

        const { days } = await importXlsxRoadBook(file);

        expect(days).toHaveLength(8);
        expect(days.map(day => day.date)).toEqual([
            "2026-09-10",
            "2026-09-11",
            "2026-09-12",
            "2026-09-13",
            "2026-09-14",
            "2026-09-15",
            "2026-09-16",
            "2026-09-17",
        ]);
        expect(days.map(day => day.title)).not.toContain("🗺️ Main Plan");
        expect(days.map(day => day.title)).not.toContain("🧰 Travel Handbook");
        expect(days[0].items.length).toBeGreaterThan(0);
        expect(days[0].venues?.length).toBeGreaterThan(0);
        expect(days[0].parkingLocations?.length).toBeGreaterThan(0);
        expect(days[0].stats).toEqual(
            expect.arrayContaining([
                { label: "🚗 Celkem km", value: "~60 km" },
            ])
        );
    });

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

    it("imports parking price and note alongside code, name and map link", async () => {
        const venueParkingHeaderRow = [
            "Priorita",
            "Typ",
            "Podnik",
            "📍",
            "⭐ Doporučení",
            "💰 Cena/os.",
            "🅿",
            "⏰ Rez.",
            "Poznámka",
            "",
            "",
            "Označení",
            "Místo",
            "📍",
            "💰 Cena",
            "📝 Poznámka",
        ];
        const rows = [
            ["Day 1 - Test"],
            ["10.9.2026 Thursday"],
            [],
            [],
            HEADER_ROW,
            [
                "7:00",
                "Snídaně",
                "Praha",
                "food",
                "FOOD",
            ],
            [],
            ["🍴 DOPORUČENÉ PODNIKY"],
            venueParkingHeaderRow,
            [
                "", "", "", "", "", "", "", "", "", "", "",
                "P1",
                "Prague Airport Garage",
                "",
                "10 USD/day",
                "Covered, near Terminal 2",
            ],
            [
                "", "", "", "", "", "", "", "", "", "", "",
                "P2",
                "LAX Rental Car Center",
                "",
                "Included",
                "",
            ],
        ];
        const file = buildWorkbookFile(rows);

        const { days } = await importXlsxRoadBook(file);

        expect(days[0].parkingLocations).toEqual([
            expect.objectContaining({
                code: "P1",
                name: "Prague Airport Garage",
                price: "10 USD/day",
                note: "Covered, near Terminal 2",
            }),
            expect.objectContaining({
                code: "P2",
                name: "LAX Rental Car Center",
                price: "Included",
                note: "",
            }),
        ]);
    });
});
