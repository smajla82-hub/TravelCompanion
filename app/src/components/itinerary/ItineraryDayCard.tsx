import { Card, Stack } from "../ui";

import type { ItineraryDay } from "../../types";
import "./ItineraryDayCard.css";

type Props = {
    day: ItineraryDay;
    onClick: () => void;
};

export function ItineraryDayCard({
    day,
    onClick,
}: Props) {
    return (
        <Card>
            <button
                type="button"
                className="itinerary-day-card__button"
                onClick={onClick}
            >
                <Stack gap="sm">

                    <h3>
                        {day.date}
                        {day.title
                            ? ` — ${day.title}`
                            : ""}
                    </h3>

                    <p>
                        {day.items.length} activities
                    </p>

                </Stack>
            </button>
        </Card>
    );
}