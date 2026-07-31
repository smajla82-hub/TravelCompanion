import { TripService } from "../services/TripService";

export function useTrips() {
    const trips = TripService.getAll();

    const activeTrip = TripService.getActive();

    return {
        trips,
        activeTrip,
    };
}