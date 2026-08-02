import { Grid, Heading } from "../ui";
import { TripCard } from "../cards";

import { useTrips } from "../../hooks/useTrips";

export function TripsSection() {

    const {
        trips,
    } = useTrips();

    return (
        <>

            <Heading level={2}>
                My Trips
            </Heading>

            <Grid>

                {trips.map((trip) => (

                    <TripCard
                        key={trip.id}
                        trip={trip}
                    />

                ))}

            </Grid>

        </>
    );

}