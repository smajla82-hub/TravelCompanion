import * as XLSX from "xlsx";

import type {
    ItineraryDay,
    ItineraryItem,
    RecommendedVenue,
    DayStat,
    ParkingLocation,
} from "../../types";
import { normalizeActivityType } from
    "../../domain/activity/ActivityTypeRegistry";

type CellValue = string | number | boolean | Date | null | undefined;

type ImportRow = CellValue[];

function getString(value: CellValue): string {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}

function extractDate(value: CellValue): string {
    const text = getString(value);

    const match = text.match(
        /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/
    );

    if (!match) {
        return "";
    }

    const [, day, month, year] = match;

    return [
        year,
        month.padStart(2, "0"),
        day.padStart(2, "0"),
    ].join("-");
}

function findColumn(
    headers: string[],
    name: string
): number {
    return headers.findIndex(
        header => header === name
    );
}

function findColumnStartingWith(
    headers: string[],
    prefix: string
): number {
    return headers.findIndex(
        header => header.startsWith(prefix)
    );
}

function findColumnContaining(
    headers: string[],
    text: string
): number {
    return headers.findIndex(
        header => header.includes(text)
    );
}

function findVenueHeaderRow(
    rows: ImportRow[]
): number {
    return rows.findIndex((row) => {
        const headers = row.map(getString);

        return (
            findColumn(headers, "Priorita") !== -1 &&
            findColumnStartingWith(headers, "Podnik") !== -1
        );
    });
}

function findVenueSectionRow(
    rows: ImportRow[]
): number {
    return rows.findIndex((row) => {
        return row.some((cell) => {
            const value = getString(cell);

            return (
                value === "DOPORUČENÉ PODNIKY" ||
                value.endsWith("DOPORUČENÉ PODNIKY")
            );
        });
    });
}

function getCellLink(
    sheet: XLSX.WorkSheet,
    rowIndex: number,
    columnIndex: number
): string {
    if (columnIndex < 0) {
        return "";
    }

    const address = XLSX.utils.encode_cell({
        r: rowIndex,
        c: columnIndex,
    });
    const cell = sheet[address];

    return cell?.l?.Target ?? "";
}

function parseVenues(
    sheet: XLSX.WorkSheet,
    rows: ImportRow[],
    date: string,
    headerRowIndex: number
): RecommendedVenue[] {
    if (headerRowIndex === -1) {
        return [];
    }

    const headers =
        (rows[headerRowIndex] ?? []).map(getString);

    const columns = {
        priority: findColumn(headers, "Priorita"),
        mealType: findColumn(headers, "Typ"),
        name: findColumnStartingWith(headers, "Podnik"),
        place: findColumnStartingWith(headers, "📍"),
        recommendation:
            findColumnContaining(headers, "Doporuč"),
        price: findColumnStartingWith(headers, "💰 Cena"),
        smartChip: findColumn(headers, "🅿"),
        reservation: findColumnContaining(headers, "Rez."),
        subtype: findColumn(headers, "Poznámka"),
    };

    if (columns.name === -1) {
        return [];
    }

    const venues: RecommendedVenue[] = [];

    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < rows.length;
        rowIndex++
    ) {
        const row = rows[rowIndex] ?? [];
        const name = getString(row[columns.name]);

        if (!name) {
            break;
        }

        const get = (column: number): string => {
            return column < 0
                ? ""
                : getString(row[column]);
        };
        const smartChipLink =
            getCellLink(
                sheet,
                rowIndex,
                columns.smartChip
            ) ||
            getCellLink(
                sheet,
                rowIndex,
                columns.place
            );

        venues.push({
            id: `${date}-venue-${venues.length + 1}`,
            priority: get(columns.priority),
            type: get(columns.mealType),
            mealType: get(columns.mealType),
            subtype: get(columns.subtype),
            name,
            smartChip:
                get(columns.smartChip) ||
                get(columns.place),
            mapLink: smartChipLink,
            recommendation: get(columns.recommendation),
            price: get(columns.price),
            reservation: get(columns.reservation),
        });
    }

    return venues;
}

function findParkingHeaderRow(
    rows: ImportRow[]
): number {
    return rows.findIndex((row) => {
        const headers = row.map(getString);

        return (
            findColumn(headers, "Označení") !== -1 &&
            findColumn(headers, "Místo") !== -1 &&
            findColumnStartingWith(headers, "📍") !== -1
        );
    });
}

function parseParkingLocations(
    sheet: XLSX.WorkSheet,
    rows: ImportRow[],
    headerRowIndex: number
): ParkingLocation[] {
    if (headerRowIndex === -1) {
        return [];
    }

    const headers =
        (rows[headerRowIndex] ?? []).map(getString);
    const columns = {
        code: findColumn(headers, "Označení"),
        name: findColumn(headers, "Místo"),
        smartChip: findColumnStartingWith(headers, "📍"),
    };
    const parkingLocations: ParkingLocation[] = [];

    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < rows.length;
        rowIndex++
    ) {
        const row = rows[rowIndex] ?? [];
        const code = getString(row[columns.code]);

        if (!code) {
            break;
        }

        const name = getString(row[columns.name]);

        if (!name) {
            continue;
        }

        parkingLocations.push({
            code,
            name,
            mapLink: getCellLink(
                sheet,
                rowIndex,
                columns.smartChip
            ),
        });
    }

    return parkingLocations;
}

function parseStats(
    rows: ImportRow[]
): DayStat[] {
    for (
        let rowIndex = 0;
        rowIndex < rows.length;
        rowIndex++
    ) {
        const row = rows[rowIndex] ?? [];
        const columnIndex = row.findIndex((cell) => {
            return getString(cell)
                .toUpperCase()
                .includes("STATISTIKY");
        });

        if (columnIndex === -1) {
            continue;
        }

        const stats: DayStat[] = [];

        for (
            let statRowIndex = rowIndex + 1;
            statRowIndex < rows.length;
            statRowIndex++
        ) {
            const statRow = rows[statRowIndex] ?? [];
            const label =
                getString(statRow[columnIndex]);
            const value =
                getString(statRow[columnIndex + 1]);

            if (!label && !value) {
                break;
            }

            if (label && value) {
                stats.push({ label, value });
            }
        }

        return stats;
    }

    return [];
}

function createItem(
    sheet: XLSX.WorkSheet,
    row: ImportRow,
    rowIndex: number,
    columns: Record<string, number>,
    date: string,
    index: number
): ItineraryItem {

    const get = (name: string): string => {
        const column = columns[name];

        if (column === undefined || column < 0) {
            return "";
        }

        return getString(row[column]);
    };

    return {
        id: `${date}-item-${index + 1}`,

        time: get("time"),

        title: get("activity"),

        location: get("location"),

        activityType: normalizeActivityType(get("activityType")),

        priority: get("priority"),

        parking: get("parking"),

        smartChip: get("smartChip"),

        mapLink: getCellLink(
            sheet,
            rowIndex,
            columns.smartChip
        ),

        price: get("price"),

        note: get("note"),

        description: get("note"),

        date,
    };
}

function parseDaySheet(
    sheet: XLSX.WorkSheet
): ItineraryDay | null {

    const rows =
        XLSX.utils.sheet_to_json<ImportRow>(
            sheet,
            {
                header: 1,
                raw: false,
                defval: "",
            }
        );

    if (rows.length < 6) {
        return null;
    }

    const title = getString(rows[0]?.[0]);
    const date = extractDate(rows[1]?.[0]);

    if (!title || !date) {
        return null;
    }

    const headers =
        (rows[4] ?? []).map(getString);

    const columns = {
        time: findColumn(headers, "Čas"),
        activity: findColumn(headers, "Aktivita"),
        location: findColumn(headers, "Lokalita"),
        activityType: findColumn(headers, "Activity Type"),
        priority: findColumn(headers, "Priorita"),
        parking: findColumn(headers, "🅿"),
        smartChip:
            findColumnStartingWith(headers, "📍"),
        price:
            findColumnStartingWith(headers, "💰"),
        note: findColumn(headers, "Poznámka"),
    };

    if (
        columns.time === -1 ||
        columns.activity === -1
    ) {
        return null;
    }

    const items: ItineraryItem[] = [];
    const venueSectionRowIndex =
        findVenueSectionRow(rows);
    const timelineEndRowIndex =
        venueSectionRowIndex === -1
            ? rows.length
            : venueSectionRowIndex;

    for (
        let rowIndex = 5;
        rowIndex < timelineEndRowIndex;
        rowIndex++
    ) {
        const row = rows[rowIndex];

        const activity =
            getString(row?.[columns.activity]);

        if (!activity) {
            continue;
        }

        const item = createItem(
            sheet,
            row,
            rowIndex,
            columns,
            date,
            items.length
        );

        items.push(item);
    }

    const venues = parseVenues(
        sheet,
        rows,
        date,
        findVenueHeaderRow(rows)
    );
    const stats = parseStats(rows);
    const parkingLocations = parseParkingLocations(
        sheet,
        rows,
        findParkingHeaderRow(rows)
    );

    return {
        id: `day-${date}`,
        date,
        title,
        items,
        venues,
        stats,
        parkingLocations,
    };
}

export async function importXlsxRoadBook(
    file: File
): Promise<ItineraryDay[]> {

    const data = await file.arrayBuffer();

    const workbook = XLSX.read(
        data,
        {
            type: "array",
            cellDates: true,
        }
    );

    const days: ItineraryDay[] = [];

    for (const sheetName of workbook.SheetNames) {

        const sheet =
            workbook.Sheets[sheetName];

        if (!sheet) {
            continue;
        }

        const day =
            parseDaySheet(
                sheet
            );

        if (day) {
            days.push(day);
        }
    }

    return days;
}