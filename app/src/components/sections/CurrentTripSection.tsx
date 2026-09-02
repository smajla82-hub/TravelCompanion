import { CurrentTripCard } from "../cards";

import { useTrips } from "../../hooks/useTrips";

type CurrentTripSectionProps = {
    onContinue: () => void;
};

export function CurrentTripSection({
    onContinue,
}: CurrentTripSectionProps) {

    const {
        activeTrip,
    } = useTrips();

    if (!activeTrip) {
        return null;
    }

    return (
        <>

            <CurrentTripCard
                trip={activeTrip}
                onContinue={onContinue}
            />

        </>
    );

}