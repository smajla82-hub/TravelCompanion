import { Card, Stack } from "../ui";

import type { ItineraryDay } from "../../types";

type Props = {
    day: ItineraryDay;
};

export function ItineraryDayDetail({ day }: Props) {

    return (
        <Card>
            <Stack gap="md">

                <div>
                    <h3>
                        {day.date}
                        {day.title
                            ? ` — ${day.title}`
                            : ""}
                    </h3>

                    <p>
                        {day.items.length} activities
                    </p>
                </div>

                <Stack gap="md">

                    {day.items.map((item) => (

                        <div key={item.id}>

                            <strong>
                                {item.time
                                    ? `${item.time} — `
                                    : ""}
                                {item.title}
                            </strong>

                            {item.location && (
                                <div>
                                    {item.location}
                                </div>
                            )}

                            {item.goal && (
                                <div>
                                    Goal: {item.goal}
                                </div>
                            )}

                            {item.priority && (
                                <div>
                                    Priority: {item.priority}
                                </div>
                            )}

                            {item.parking && (
                                <div>
                                    Parking: {item.parking}
                                </div>
                            )}

                            {item.smartChip && (
                                <div>
                                    {item.smartChip}
                                </div>
                            )}

                            {item.price !== undefined &&
                                item.price !== null && (
                                <div>
                                    Price: {item.price}
                                </div>
                            )}

                            {item.note && (
                                <div>
                                    Note: {item.note}
                                </div>
                            )}

                        </div>

                    ))}

                </Stack>

            </Stack>
        </Card>
    );
}