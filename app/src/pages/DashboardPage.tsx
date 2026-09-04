import { useState } from "react";
import type { CSSProperties } from "react";

import {
    Container,
    Heading,
} from "../components/ui";

import {
    CurrentTripSection,
    ItinerarySection,
} from "../components/sections";

import { TOP_BACKGROUND_URL } from "../styles/brandAssets";

import "./DashboardPage.css";

const brandHeaderStyle = {
    "--tc-top-artwork": `url("${TOP_BACKGROUND_URL}")`,
} as CSSProperties;

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

            <header className="tc-brand-header" style={brandHeaderStyle}>
                <Heading level={1}>Travel Companion</Heading>

                <CurrentTripSection
                    onContinue={continueTrip}
                />
            </header>

            <ItinerarySection
                key={itineraryResetKey}
            />

        </Container>
    );
}