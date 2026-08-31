import { Card, Stack } from "../ui";

import "./ItineraryCard.css";

import type { ItineraryDay } from "../../types";

type Props = {
    day: ItineraryDay;
    onClick?: () => void;
};

export function ItineraryCard({
    day,
    onClick,
}: Props) {
    return (
        <div onClick={onClick}>
            <Card>
                <Stack gap="sm">
                    <h3>
                        {day.date} — {day.title}
                    </h3>

                    <p>
                        {day.items.length} activities
                    </p>
                </Stack>
            </Card>
        </div>
    );
}