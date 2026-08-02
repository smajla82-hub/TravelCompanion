import { Card, Heading, Stack } from "../ui";

import type { Trip } from "../../types";

type TripDetailProps = {
    trip: Trip;
};

export function TripDetail({ trip }: TripDetailProps) {
    return (
        <Card>
            <Stack gap="md">
                <Heading level={2}>
                    {trip.destination}
                </Heading>

                <p>
                    {trip.country}
                </p>

                <p>
                    {trip.startDate} – {trip.endDate}
                </p>

                <p>
                    {trip.travellers} travellers
                </p>
            </Stack>
        </Card>
    );
}