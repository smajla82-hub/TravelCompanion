import { Card, Stack, Icon } from "../ui";
import { ItineraryDayAdditionalDetails } from
    "../itinerary/ItineraryDayAdditionalDetails";

import type {
    ItineraryDay,
} from "../../types";
import { getActivityTypeDefinition } from
    "../../domain/activity/ActivityTypeRegistry";

type RoadBookPreviewProps = {
    days: ItineraryDay[];
};

export function RoadBookPreview({
    days,
}: RoadBookPreviewProps) {

    if (days.length === 0) {
        return null;
    }

    return (
        <Stack gap="md">

            <h2>
                Imported RoadBook
            </h2>

            {days.map((day) => (
                <Card key={day.id}>
                    <Stack gap="md">

                        <h3>
                            {day.date}
                            {day.title
                                ? ` — ${day.title}`
                                : ""}
                        </h3>

                        <p>
                            {day.items.length} activities
                        </p>

                        <Stack gap="md">

                            {day.items.map((item) => (
                                <div key={item.id}>

                                    <strong>
                                        <Icon
                                            name={
                                                getActivityTypeDefinition(
                                                    item.activityType
                                                ).icon
                                            }
                                            width={16}
                                            height={16}
                                        />
                                        {" "}
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
                                            {item.mapLink ? (
                                                <a
                                                    href={item.mapLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {item.smartChip}
                                                </a>
                                            ) : (
                                                item.smartChip
                                            )}
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

                        <ItineraryDayAdditionalDetails
                            day={day}
                        />

                    </Stack>
                </Card>
            ))}

        </Stack>
    );
}