import type { ItineraryItem } from "./ItineraryItem";
import type { RecommendedVenue } from
    "./RecommendedVenue";
import type { DayStat } from "./DayStat";

export interface ItineraryDay {

    id: string;

    date: string;

    title: string;

    items: ItineraryItem[];

    venues?: RecommendedVenue[];

    stats?: DayStat[];

}