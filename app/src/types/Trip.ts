import type { ItineraryDay } from "./ItineraryDay";

export type TripStatus =
    | "planning"
    | "active"
    | "finished";

export interface Trip {

    id: string;

    destination: string;

    country: string;

    startDate: string;

    endDate: string;

    travellers: number;

    coverImage?: string;

    status: TripStatus;

    itinerary?: ItineraryDay[];

}