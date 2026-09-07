import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import {
    Container,
    Heading,
} from "../components/ui";

import {
    CurrentTripSection,
    ItinerarySection,
} from "../components/sections";

import { useTrips } from "../hooks";
import { isItineraryReady } from "../utils/isItineraryReady";
import { TOP_BACKGROUND_URL } from "../styles/brandAssets";
import { scrollToItinerary } from "./scrollToItinerary";

import "./DashboardPage.css";

const brandHeaderStyle = {
    "--tc-top-artwork": `url("${TOP_BACKGROUND_URL}")`,
} as CSSProperties;

export default function DashboardPage() {

    const { activeTrip } = useTrips();

    const [itineraryResetToken, setItineraryResetToken] =
        useState(0);
    const continueRequested = useRef(false);

    function continueTrip() {
        setItineraryResetToken(value => value + 1);
        continueRequested.current = true;
    }

    // An Online Trip's itinerary loads asynchronously; scrolling before it
    // resolves would target the "Today's itinerary is not available"
    // intermediate state and then jump once the real itinerary arrives.
    // Offline Trips always have their itinerary available synchronously, so
    // this only ever holds Continue Trip back for Online Trips.
    const itineraryReady = isItineraryReady(activeTrip);

    useEffect(() => {
        if (!continueRequested.current || !itineraryReady) {
            return;
        }

        let frameId: number | undefined;
        const scrollWhenMounted = () => {
            if (scrollToItinerary(document)) {
                continueRequested.current = false;
                return;
            }

            frameId = requestAnimationFrame(scrollWhenMounted);
        };

        scrollWhenMounted();
        return () => {
            if (frameId !== undefined) {
                cancelAnimationFrame(frameId);
            }
        };
    }, [itineraryResetToken, itineraryReady]);

    return (
        <Container>

            <header className="tc-brand-header" style={brandHeaderStyle}>
                <Heading level={1}>Travel Companion</Heading>

                <CurrentTripSection
                    onContinue={continueTrip}
                />
            </header>

            <ItinerarySection
                resetToken={itineraryResetToken}
            />

        </Container>
    );
}