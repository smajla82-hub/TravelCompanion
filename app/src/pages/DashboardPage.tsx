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

import { TOP_BACKGROUND_URL } from "../styles/brandAssets";
import { scrollToItinerary } from "./scrollToItinerary";

import "./DashboardPage.css";

const brandHeaderStyle = {
    "--tc-top-artwork": `url("${TOP_BACKGROUND_URL}")`,
} as CSSProperties;

export default function DashboardPage() {

    const [itineraryResetKey, setItineraryResetKey] =
        useState(0);
    const continueRequested = useRef(false);

    function continueTrip() {
        setItineraryResetKey(value => value + 1);
        continueRequested.current = true;
    }

    useEffect(() => {
        if (!continueRequested.current) {
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
    }, [itineraryResetKey]);

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