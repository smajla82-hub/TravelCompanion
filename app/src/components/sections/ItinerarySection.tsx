import { useState } from "react";

import { Grid, Heading } from "../ui";

import {
    ItineraryDayCard,
    ItineraryDayDetail,
} from "../itinerary";

import { TripService } from "../../services/TripService";

import type { ItineraryDay } from "../../types";

export function ItinerarySection() {
    const activeTrip =
        TripService.getActive();

    const itinerary =
        activeTrip?.itinerary ?? [];

    const [selectedDay, setSelectedDay] =
        useState<ItineraryDay | null>(null);

    if (selectedDay) {
        return (
            <>
                <Heading level={2}>
                    Itinerary
                </Heading>

                <ItineraryDayDetail
                    day={selectedDay}
                    onClose={() =>
                        setSelectedDay(null)
                    }
                />
            </>
        );
    }

    return (
        <>
            <Heading level={2}>
                Itinerary
            </Heading>

            <Grid>
                {itinerary.map((day) => (
                    <ItineraryDayCard
                        key={day.id}
                        day={day}
                        onClick={() =>
                            setSelectedDay(day)
                        }
                    />
                ))}
            </Grid>
        </>
    );
}