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
import { Link } from "react-router-dom";
import { Settings } from "../components/ui/icon";
import "./DashboardPage.css";

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

            <div className="dashboard-header">
                <Heading level={1}>Travel Companion</Heading>
                <Link className="settings-button" to="/settings" aria-label="Settings"><Settings /></Link>
            </div>
            <div className="dashboard-actions">
                <Button variant="success" onClick={() => setNewTripOpen(true)}>+ New Trip</Button>
                <Button variant="outline" onClick={() => document.getElementById("trips-section")?.scrollIntoView({ behavior: "smooth" })}>🧳 My Trips</Button>
            </div>

            <CurrentTripSection
                onContinue={continueTrip}
            />

            <div id="trips-section"><TripsSection onTripChanged={refreshTrips} /></div>

            <ItinerarySection
                key={itineraryResetKey}
            />

            <NewTripModal
                open={newTripOpen}
                onClose={() =>
                    setNewTripOpen(false)
                }
            />

        </Container>
    );
}