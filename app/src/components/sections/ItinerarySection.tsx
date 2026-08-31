import { Grid, Heading } from "../ui";

import { ItineraryCard } from "../itinerary";

import { TripService } from "../../services/TripService";

export function ItinerarySection() {

    const activeTrip =
        TripService.getActive();

    const itinerary =
        activeTrip?.itinerary ?? [];

    return (
        <>
            <Heading level={2}>
                Itinerary
            </Heading>

            <Grid>

                {itinerary.map((item) => (

                    <ItineraryCard
                        key={item.id}
                        item={item}
                    />

                ))}

            </Grid>
        </>
    );
}