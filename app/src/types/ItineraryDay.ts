import type { ItineraryItem } from "./ItineraryItem";

export interface ItineraryDay {

    id: string;

    date: string;

    title: string;

    items: ItineraryItem[];

}