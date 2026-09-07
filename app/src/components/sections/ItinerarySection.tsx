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
import { isItineraryReady } from "../../utils/isItineraryReady";

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

type ItinerarySectionProps = {
    /**
     * Bumped by the Dashboard's Continue Trip action to reset the section
     * back to its default "current activity" view in place, without
     * remounting the component (a remount would re-run the itinerary
     * loading effect below and could drop in-flight state).
     */
    resetToken?: number;
};

export function ItinerarySection({ resetToken }: ItinerarySectionProps = {}) {
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
        if (!activeTrip || activeTrip.source !== "online" || activeTrip.itineraryLoaded) {
            return;
        }

        void createTripAdapter(activeTrip).getTrip()
            .then(trip => OnlineTripStore.applyTrip(trip))
            .catch(() => undefined);
    }, [activeTrip]);

    const itinerary =
        activeTrip?.itinerary ?? [];

    const [selectedDayId, setSelectedDayId] =
        useState<string | null>(null);
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
            setSelectedDayId(null);
            setView("current");
            setDayDetailMode("full");
            previousActiveTripId.current =
                activeTripId;
        }
    }, [activeTripId]);

    const previousResetToken = useRef(resetToken);

    useEffect(() => {
        if (
            resetToken !== undefined &&
            previousResetToken.current !== resetToken
        ) {
            setSelectedDayId(null);
            setView("current");
            setDayDetailMode("full");
        }
        previousResetToken.current = resetToken;
    }, [resetToken]);

    // A mutation performed inside the (offline or online) day detail view
    // does not otherwise cause this component to re-render: local Trip
    // mutations go through the module-level `TripService` array, which has
    // no subscription mechanism of its own, so nothing schedules a render
    // after the mutation resolves. Bumping this counter forces a fresh
    // render, which re-reads `activeTrip` from `useTrips()` and recomputes
    // `itinerary`/`selectedDay` from the latest persisted state.
    const [, setRefreshTick] = useState(0);
    function refreshItinerary() {
        setRefreshTick(tick => tick + 1);
    }

    function openDayDetail(
        day: ItineraryDay,
        mode: DayDetailMode
    ) {
        setSelectedDayId(day.id);
        setDayDetailMode(mode);
        setView("day-detail");
    }

    function goToDayList() {
        setDayDetailMode("full");
        setView("day-list");
    }

    const selectedDay = itinerary.find(day => day.id === selectedDayId);

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
                    onDayChanged={refreshItinerary}
                />
            </section>
        );
    }

    if (view === "current" && activeTrip) {
        // An Online Trip's itinerary is fetched asynchronously (see the
        // effect above): until it resolves, `activeTrip.itinerary` is still
        // empty. Showing `CurrentActivityView` in that window would render
        // its "Today's itinerary is not available" state as a false
        // intermediate result, which then flashes/reflows once the real
        // itinerary arrives. A neutral loading state avoids that flash.
        const itineraryLoading = !isItineraryReady(activeTrip);

        return (
            <section id="itinerary-section">
                <div className="itinerary-heading"><Heading level={2}>Itinerary</Heading><Button variant="pill" compact type="button" onClick={goToDayList}><Icon name="calendarDays" width={16} height={16} /> View whole itinerary</Button></div>

                {itineraryLoading ? (
                    <p>Loading itinerary…</p>
                ) : (
                    <CurrentActivityView
                        trip={activeTrip}
                        onViewWholeItinerary={goToDayList}
                        onShowDay={day =>
                            openDayDetail(day, "remaining")
                        }
                    />
                )}
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