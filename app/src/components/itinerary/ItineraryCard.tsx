import { Card, Stack } from "../ui";

import "./ItineraryCard.css";

import type { ItineraryDay } from "../../types";

type Props = {
    day: ItineraryDay;
    isActive?: boolean;
    onClick?: () => void;
};

export function ItineraryCard({
    day,
    isActive = false,
    onClick,
}: Props) {
    return (
        <div onClick={onClick}>
            <Card
                className={
                    isActive
                        ? "itinerary-card--active"
                        : undefined
                }
            >
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