import { Container, Heading } from "../components/ui";

import {
    CurrentTripSection,
    TripsSection,
    ItinerarySection,
} from "../components/sections";

export default function DashboardPage() {
    return (
        <Container>
            <Heading level={1}>
                Travel Companion
            </Heading>

            <CurrentTripSection />

            <TripsSection />

            <ItinerarySection />
        </Container>
    );
}