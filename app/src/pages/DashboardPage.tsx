import { Container, Grid, Heading } from "../components/ui";

import { CurrentTripCard } from "../components/cards";

import { TripService } from "../services/TripService";

export default function DashboardPage() {
    const activeTrip = TripService.getActive();

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