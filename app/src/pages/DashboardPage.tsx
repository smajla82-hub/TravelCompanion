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

export default function DashboardPage() {

    const [newTripOpen, setNewTripOpen] =
        useState(false);

    const [, forceRefresh] = useState(0);

    function refreshTrips() {
        forceRefresh(v => v + 1);
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

            <CurrentTripSection />

            <TripsSection />

            <ItinerarySection />

            <NewTripModal
                open={newTripOpen}
                onClose={() =>
                    setNewTripOpen(false)
                }
                onTripCreated={refreshTrips}
            />
        </Container>
    );
}