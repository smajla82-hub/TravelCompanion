import { Grid, Heading } from "../ui";

import { ItineraryCard } from "../itinerary";

import { ItineraryService } from "../../services/itinerary";

export function ItinerarySection() {

    const itinerary =
        ItineraryService.getAll();

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