import { Card, Heading, Stack, Button } from "../ui";

import type { Trip } from "../../types";

type TripDetailProps = {
    trip: Trip;
    onEdit?: () => void;
    onDelete?: () => void;
    onSetActive?: () => void;
};

export function TripDetail({
    trip,
    onEdit,
    onDelete,
    onSetActive,
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

                <Stack gap="sm">

                    {trip.status !== "active" && (
                        <Button
                            type="button"
                            onClick={onSetActive}
                        >
                            Set as Active Trip
                        </Button>
                    )}

                    <Button
                        type="button"
                        onClick={onEdit}
                    >
                        Edit Trip
                    </Button>

                    <Button
                        type="button"
                        onClick={onDelete}
                    >
                        Delete Trip
                    </Button>

                </Stack>

            </Stack>
        </Card>
    );
}