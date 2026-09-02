import { useState } from "react";

import {
    Container,
    Heading,
    Button,
} from "../components/ui";

import {
    CurrentTripSection,
    TripsSection,
    ItinerarySection,
} from "../components/sections";

import { NewTripModal } from "../components/trips";
import { RoadBookImport } from "../components/import";

export default function DashboardPage() {

    const [newTripOpen, setNewTripOpen] =
        useState(false);

    const [, forceRefresh] = useState(0);
    const [itineraryResetKey, setItineraryResetKey] =
        useState(0);

    function refreshTrips() {
        forceRefresh(v => v + 1);
    }

    function continueTrip() {
        setItineraryResetKey(value => value + 1);
        document
            .getElementById("itinerary-section")
            ?.scrollIntoView({
                behavior: "smooth",
            });
    }

    return (
        <Container>

            <Heading level={1}>
                Travel Companion
            </Heading>

            <Button
                onClick={() =>
                    setNewTripOpen(true)
                }
            >
                + New Trip
            </Button>

            <CurrentTripSection
                onContinue={continueTrip}
            />

            <TripsSection
                onTripChanged={refreshTrips}
            />

            <ItinerarySection
                key={itineraryResetKey}
            />

            <RoadBookImport />

            <NewTripModal
                open={newTripOpen}
                onClose={() =>
                    setNewTripOpen(false)
                }
            />

        </Container>
    );
}