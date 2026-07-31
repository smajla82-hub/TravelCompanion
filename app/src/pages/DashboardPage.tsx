import { Container, Grid, Heading } from "../components/ui";

import {
    CurrentTripCard,
    TripCard,
} from "../components/cards";

import { TripService } from "../services/TripService";

export default function DashboardPage() {
    const activeTrip = TripService.getActive();

    const trips = TripService.getAll();

    return (
        <Container>
            <Heading level={1}>
                Travel Companion
            </Heading>

            {activeTrip && (
                <>
                    <Heading level={2}>
                        Current Trip
                    </Heading>

                    <CurrentTripCard trip={activeTrip} />
                </>
            )}

            <Heading level={2}>
                My Trips
            </Heading>

            <Grid columns={2}>
                {trips.map((trip) => (
                    <TripCard
                        key={trip.id}
                        trip={trip}
                    />
                ))}
            </Grid>
        </Container>
    );
}