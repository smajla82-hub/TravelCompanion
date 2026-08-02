import { useState } from "react";

import type { Trip } from "../types";

export function useSelectedTrip() {
    const [selectedTrip, setSelectedTrip] =
        useState<Trip | null>(null);

    return {
        selectedTrip,
        setSelectedTrip,
    };
}