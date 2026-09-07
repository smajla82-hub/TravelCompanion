import { useEffect, useMemo, useRef, useState } from "react";

import { Button, Grid, Heading, Icon } from "../ui";

import {
    ItineraryCard,
    ItineraryDayDetail,
    ItineraryDayModal,
    CurrentActivityView,
} from "../itinerary";

import { createTripAdapter } from "../../services/TripAdapter";
import { OnlineTripStore } from "../../services/OnlineTripStore";
import { useTrips } from "../../hooks";
import { AuthService } from "../../services/AuthService";

import {
    isActiveItineraryDay,
    shouldFilterToRemainingActivities,
} from "../../utils/getActiveItineraryDay";

import type { ItineraryDay, Trip } from "../../types";
import "./ItinerarySection.css";

type ItineraryView = "current" | "day-list" | "day-detail";
type DayDetailMode = "full" | "remaining";

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
    const { activeTrip } = useTrips();
    const adapter = useMemo(
        () => activeTrip ? createTripAdapter(activeTrip) : undefined,
        [activeTrip],
    );
    const [canEdit, setCanEdit] = useState(activeTrip?.source !== "online");
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!adapter || adapter.source === "local") {
            setCanEdit(true);
            return;
        }
        void adapter.members().then(members => {
            const userId = AuthService.getUser()?.id;
            setCanEdit(members.some(member => member.userId === userId && (member.role === "owner" || member.role === "editor")));
        }).catch(() => setCanEdit(false));
    }, [adapter]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (!activeTrip || activeTrip.source !== "online" || activeTrip.itinerary?.length) {
            return;
        }

        void createTripAdapter(activeTrip).getTrip()
            .then(trip => OnlineTripStore.applyTrip(trip))
            .catch(() => undefined);
    }, [activeTrip]);

    const itinerary =
        activeTrip?.itinerary ?? [];

    const [selectedDay, setSelectedDay] =
        useState<ItineraryDay | null>(null);
    const [view, setView] =
        useState<ItineraryView>("current");
    const [dayDetailMode, setDayDetailMode] =
        useState<DayDetailMode>("full");
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
            setDayDetailMode("full");
            previousActiveTripId.current =
                activeTripId;
        }
    }, [activeTripId]);

    function openDayDetail(
        day: ItineraryDay,
        mode: DayDetailMode
    ) {
        setSelectedDay(day);
        setDayDetailMode(mode);
        setView("day-detail");
    }

    function goToDayList() {
        setDayDetailMode("full");
        setView("day-list");
    }

    if (view === "day-detail" && selectedDay) {
        const showRemainingOnly =
            shouldFilterToRemainingActivities(
                dayDetailMode,
                selectedDay.date,
                activeTrip
            );

        return (
            <section id="itinerary-section">
                <div className="itinerary-heading"><Heading level={2}>Itinerary</Heading><Button variant="pill" compact type="button" onClick={goToDayList}><Icon name="calendarDays" width={16} height={16} /> View whole itinerary</Button></div>

                <ItineraryDayDetail
                    day={selectedDay}
                    adapter={adapter}
                    editable={canEdit}
                    showRemainingOnly={showRemainingOnly}
                    onClose={goToDayList}
                    onDayChanged={() => {
                        const updatedDay =
                            activeTrip?.itinerary
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
                <div className="itinerary-heading"><Heading level={2}>Itinerary</Heading><Button variant="pill" compact type="button" onClick={goToDayList}><Icon name="calendarDays" width={16} height={16} /> View whole itinerary</Button></div>

                <CurrentActivityView
                    trip={activeTrip}
                    onViewWholeItinerary={goToDayList}
                    onShowDay={day =>
                        openDayDetail(day, "remaining")
                    }
                />
            </section>
        );
    }

    return (
        <section id="itinerary-section">
            <div className="itinerary-heading"><Heading level={2}>Itinerary</Heading><Button variant="pill" compact type="button" onClick={() => setView("current")}><Icon name="calendarDays" width={16} height={16} /> View whole itinerary</Button></div>

            {activeTrip && canEdit && (
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
                        onClick={() =>
                            openDayDetail(day, "full")
                        }
                    />
                ))}
            </Grid>

            {activeTrip && canEdit && (
                <ItineraryDayModal
                    open={dayModalOpen}
                    defaultDate={getDefaultDayDate(activeTrip)}
                    onClose={() => setDayModalOpen(false)}
                    onSubmit={(day) => {
                        void adapter?.addDay(day).then(newDay => {
                            setDayModalOpen(false);
                            if (newDay) openDayDetail(newDay, "full");
                        });

                    }}
                />
            )}
        </section>
    );
}