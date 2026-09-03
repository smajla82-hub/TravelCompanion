import { useEffect, useRef, useState } from "react";

import { Button, Grid, Heading, Icon } from "../ui";

import {
    ItineraryCard,
    ItineraryDayDetail,
    CurrentActivityView,
} from "../itinerary";

import { TripService } from "../../services/TripService";

import type { ItineraryDay } from "../../types";
import "./ItinerarySection.css";

type ItineraryView = "current" | "day-list" | "day-detail";

export function ItinerarySection() {
    const activeTrip =
        TripService.getActive();

    const itinerary =
        activeTrip?.itinerary ?? [];

    const [selectedDay, setSelectedDay] =
        useState<ItineraryDay | null>(null);
    const [view, setView] =
        useState<ItineraryView>("current");

    const activeTripId = activeTrip?.id;
    const previousActiveTripId =
        useRef(activeTripId);

    useEffect(() => {
        if (
            previousActiveTripId.current !==
            activeTripId
        ) {
            setSelectedDay(null);
            setView("current");
            previousActiveTripId.current =
                activeTripId;
        }
    }, [activeTripId]);

    if (view === "day-detail" && selectedDay) {
        return (
            <section id="itinerary-section">
                <div className="itinerary-heading"><Heading level={2}>Itinerary</Heading><Button variant="pill" compact type="button" onClick={() => setView("day-list")}><Icon name="calendarDays" width={16} height={16} /> View whole itinerary</Button></div>

                <ItineraryDayDetail
                    day={selectedDay}
                    tripId={activeTrip?.id ?? ""}
                    onClose={() =>
                        setView("day-list")
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

    if (view === "current" && activeTrip) {
        return (
            <section id="itinerary-section">
                <div className="itinerary-heading"><Heading level={2}>Itinerary</Heading><Button variant="pill" compact type="button" onClick={() => setView("day-list")}><Icon name="calendarDays" width={16} height={16} /> View whole itinerary</Button></div>

                <CurrentActivityView
                    trip={activeTrip}
                    onViewWholeItinerary={() =>
                        setView("day-list")
                    }
                    onShowDay={day => {
                        setSelectedDay(day);
                        setView("day-detail");
                    }}
                />
            </section>
        );
    }

    return (
        <section id="itinerary-section">
            <div className="itinerary-heading"><Heading level={2}>Itinerary</Heading><Button variant="pill" compact type="button" onClick={() => setView("current")}><Icon name="calendarDays" width={16} height={16} /> View whole itinerary</Button></div>

            {activeTrip && (
                <Button
                    type="button"
                    onClick={() => setView("current")}
                >
                    Current Activity
                </Button>
            )}

            <Grid>
                {itinerary.map(day => (
                    <ItineraryCard
                        key={day.id}
                        day={day}
                        onClick={() => {
                            setSelectedDay(day);
                            setView("day-detail");
                        }}
                    />
                ))}
            </Grid>
        </section>
    );
}