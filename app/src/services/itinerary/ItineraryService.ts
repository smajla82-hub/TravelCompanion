import type { ItineraryItem } from "../../types";

export class ItineraryService {

    static getAll(): ItineraryItem[] {

        return [

            {
                id: "1",
                title: "Departure from Prague",
                location: "Prague Airport",
                date: "2026-07-15"
            },

            {
                id: "2",
                title: "Arrival at Lago di Garda",
                location: "Italy",
                date: "2026-07-15"
            },

            {
                id: "3",
                title: "Boat Trip",
                location: "Sirmione",
                date: "2026-07-17"
            }

        ];

    }

}