import { useState } from "react";

import { Button, Stack } from "../ui";
import "../trips/NewTripModal.css";
import {
    counterClassName,
    exceedsTextLimit,
    formatCharacterCounter,
    TEXT_LIMIT_LABELS,
} from "../../domain/validation/textLimits";

export type ItineraryDayFields = {
    date: string;
    title: string;
};

type ItineraryDayFormProps = {
    defaultDate: string;
    onSubmit: (day: ItineraryDayFields) => void;
};

export function ItineraryDayForm({
    defaultDate,
    onSubmit,
}: ItineraryDayFormProps) {
    const [date, setDate] = useState(defaultDate);
    const [title, setTitle] = useState("");

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!date) {
            alert("Date is required.");

            return;
        }

        if (!title.trim()) {
            alert("Day title is required.");

            return;
        }

        if (exceedsTextLimit(title, "dayTitle")) {
            alert(
                `${TEXT_LIMIT_LABELS.dayTitle} exceeds the maximum allowed length (${formatCharacterCounter(title, "dayTitle")}).`
            );

            return;
        }

        onSubmit({
            date,
            title,
        });
    }

    return (
        <form className="tc-trip-form" onSubmit={handleSubmit}>
            <Stack gap="md">
                <label>
                    Date
                    <input
                        type="date"
                        value={date}
                        onChange={(event) =>
                            setDate(event.target.value)
                        }
                    />
                </label>

                <label>
                    Day title
                    <input
                        type="text"
                        value={title}
                        onChange={(event) =>
                            setTitle(event.target.value)
                        }
                    />
                    <span className={counterClassName(title, "dayTitle")}>
                        {formatCharacterCounter(title, "dayTitle")}
                    </span>
                </label>

                <Button type="submit">
                    Save Day
                </Button>
            </Stack>
        </form>
    );
}
