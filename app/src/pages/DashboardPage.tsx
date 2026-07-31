import { Container, Grid, Heading } from "../components/ui";

import {
    CurrentTripCard,
    TripCard,
} from "../components/cards";

import { useTrips } from "../hooks/useTrips";

export default function DashboardPage() {
    const {
        trips,
        activeTrip,
    } = useTrips();

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