import { Card, Stack } from "../ui";

import "./ItineraryCard.css";

import type { ItineraryItem } from "../../types";

type Props = {
    item: ItineraryItem;
};

export function ItineraryCard({ item }: Props) {
    return (
        <Card>
            <Stack gap="sm">
                <h3>{item.title}</h3>

                <p>{item.location}</p>

                <p>{item.date}</p>
            </Stack>
        </Card>
    );
}