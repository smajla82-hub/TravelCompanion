import { useEffect, useRef, useState } from "react";

import { Grid, Heading } from "../ui";

import {
    ItineraryCard,
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

    const activeTripId = activeTrip?.id;
    const previousActiveTripId =
        useRef(activeTripId);

    useEffect(() => {
        if (
            previousActiveTripId.current !==
            activeTripId
        ) {
            setSelectedDay(null);
            previousActiveTripId.current =
                activeTripId;
        }
    }, [activeTripId]);

    if (selectedDay) {
        return (
            <section id="itinerary-section">
                <Heading level={2}>
                    Itinerary
                </Heading>

                <ItineraryDayDetail
                    day={selectedDay}
                    tripId={activeTrip?.id ?? ""}
                    onClose={() =>
                        setSelectedDay(null)
                    }
                    onDayChanged={() => {
                        const updatedDay =
                            TripService.getActive()
                                ?.itinerary
                                ?.find(
                                    day =>
                                        day.id ===
                                        selectedDay.id
                                );

                        setSelectedDay(
                            updatedDay ?? null
                        );
                    }}
                />
            </section>
        );
    }

    return (
        <section id="itinerary-section">
            <Heading level={2}>
                Itinerary
            </Heading>

            <Grid>
                {itinerary.map((day) => (
                    <ItineraryCard
    key={day.id}
    day={day}
    onClick={() =>
        setSelectedDay(day)
    }
/>
                ))}
            </Grid>
        </section>
    );
}