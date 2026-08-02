import { Heading } from "../ui";
import { CurrentTripCard } from "../cards";

import { useTrips } from "../../hooks/useTrips";

export function CurrentTripSection() {

    const {
        activeTrip,
    } = useTrips();

    if (!activeTrip) {
        return null;
    }

    return (
        <>

            <Heading level={2}>
                Current Trip
            </Heading>

            <CurrentTripCard
                trip={activeTrip}
            />

        </>
    );

}