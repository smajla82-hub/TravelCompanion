import { Container, Grid, Heading } from "../components/ui";

import { CurrentTripCard } from "../components/cards";

import { trips } from "../data/trips";

export default function DashboardPage() {
    const activeTrip = trips.find((trip) => trip.active);

    return (
        <Container>
            <Heading level={1}>
                Travel Companion
            </Heading>

            <Grid columns={2}>
                {activeTrip && (
                    <CurrentTripCard trip={activeTrip} />
                )}
            </Grid>
        </Container>
    );
}