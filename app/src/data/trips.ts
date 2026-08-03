import type { Trip } from "../types";

export const trips: Trip[] = [
    {
        id: "1",
        destination: "Lago di Garda",
        country: "Italy",
        startDate: "2026-07-15",
        endDate: "2026-07-20",
        travellers: 4,
        status: "active",
    },
    {
        id: "2",
        destination: "Prague",
        country: "Czech Republic",
        startDate: "2026-09-10",
        endDate: "2026-09-12",
        travellers: 2,
        status: "planning",
    },
];