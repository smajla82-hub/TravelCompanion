import { Card, Heading, Stack, Button } from "../ui";

import type { Trip } from "../../types";

type TripDetailProps = {
    trip: Trip;
    onEdit?: () => void;
};

export function TripDetail({
    trip,
    onEdit,
}: TripDetailProps) {
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

                <Button
                    type="button"
                    onClick={onEdit}
                >
                    Edit Trip
                </Button>
            </Stack>
        </Card>
    );
}