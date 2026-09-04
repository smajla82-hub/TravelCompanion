import { useEffect, useRef, useState } from "react";

import { Button, Grid, Heading, Icon } from "../ui";

import {
    ItineraryCard,
    ItineraryDayDetail,
    ItineraryDayModal,
    CurrentActivityView,
} from "../itinerary";

import { TripService } from "../../services/TripService";

import { isActiveItineraryDay } from "../../utils/getActiveItineraryDay";

import type { ItineraryDay, Trip } from "../../types";
import "./ItinerarySection.css";

type ItineraryView = "current" | "day-list" | "day-detail";

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDefaultDayDate(trip: Trip): string {
    const itinerary = trip.itinerary ?? [];

    if (itinerary.length === 0) {
        return trip.startDate.slice(0, 10);
    }

    const lastDate = [...itinerary]
        .sort((left, right) =>
            left.date.localeCompare(right.date)
        )
        .at(-1)?.date;

    if (!lastDate) {
        return trip.startDate.slice(0, 10);
    }

    const nextDate = new Date(`${lastDate}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);

    return formatLocalDate(nextDate);
}

export function ItinerarySection() {
    const activeTrip =
        TripService.getActive();

    const itinerary =
        activeTrip?.itinerary ?? [];

    const [selectedDay, setSelectedDay] =
        useState<ItineraryDay | null>(null);
    const [view, setView] =
        useState<ItineraryView>("current");
    const [dayModalOpen, setDayModalOpen] =
        useState(false);

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
                <div className="itinerary-controls">
                    <Button
                        type="button"
                        onClick={() => setView("current")}
                    >
                        Current Activity
                    </Button>

                    <Button
                        type="button"
                        onClick={() => setDayModalOpen(true)}
                    >
                        Add Day
                    </Button>
                </div>
            )}

            <Grid>
                {itinerary.map(day => (
                    <ItineraryCard
                        key={day.id}
                        day={day}
                        isActive={
                            activeTrip
                                ? isActiveItineraryDay(day.date, activeTrip)
                                : false
                        }
                        onClick={() => {
                            setSelectedDay(day);
                            setView("day-detail");
                        }}
                    />
                ))}
            </Grid>

            {activeTrip && (
                <ItineraryDayModal
                    open={dayModalOpen}
                    defaultDate={getDefaultDayDate(activeTrip)}
                    onClose={() => setDayModalOpen(false)}
                    onSubmit={(day) => {
                        const newDay =
                            TripService.addItineraryDay(
                                activeTrip.id,
                                day
                            );

                        setDayModalOpen(false);

                        if (newDay) {
                            setSelectedDay(newDay);
                            setView("day-detail");
                        }
                    }}
                />
            )}
        </section>
    );
}