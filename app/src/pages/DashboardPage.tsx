import { useState } from "react";

import {
    Container,
    Heading,
} from "../components/ui";

import {
    CurrentTripSection,
    ItinerarySection,
} from "../components/sections";

import "./DashboardPage.css";

export default function DashboardPage() {

    const [itineraryResetKey, setItineraryResetKey] =
        useState(0);

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
            </div>

            <CurrentTripSection
                onContinue={continueTrip}
            />

            <ItinerarySection
                key={itineraryResetKey}
            />

        </Container>
    );
}