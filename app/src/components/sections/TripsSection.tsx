import { useState } from "react";

import { Grid, Heading } from "../ui";
import { TripCard } from "../cards";
import { TripDetail } from "../tripDetail";

import { useTrips } from "../../hooks";

import type { Trip } from "../../types";

export function TripsSection() {
    const { trips } = useTrips();

    const [selectedTrip, setSelectedTrip] =
        useState<Trip | null>(null);

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
                        onClick={() =>
                            setSelectedTrip(trip)
                        }
                    />
                ))}
            </Grid>

            {selectedTrip && (
                <>
                    <Heading level={2}>
                        Trip Detail
                    </Heading>

                    <TripDetail
                        trip={selectedTrip}
                    />
                </>
            )}
        </>
    );
}