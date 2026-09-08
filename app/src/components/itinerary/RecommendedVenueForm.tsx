import { useState } from "react";

import { Button, Stack } from "../ui";
import "../trips/NewTripModal.css";

import type { RecommendedVenue } from "../../types";
import {
    MEAL_TYPE_OPTIONS,
    VENUE_SUBTYPE_OPTIONS,
    resolveControlledOption,
    isOtherOption,
} from "../../domain/venue/VenueOptions";
import {
    VENUE_PRIORITY_OPTIONS,
    normalizeVenuePriority,
} from "../../domain/venue/VenuePriorityRegistry";
import {
    TEXT_LIMIT_LABELS,
    counterClassName,
    exceedsTextLimit,
    formatCharacterCounter,
} from "../../domain/validation/textLimits";

export type RecommendedVenueFields = Omit<RecommendedVenue, "id">;

type RecommendedVenueFormProps = {
    venue?: RecommendedVenue;
    onSubmit: (venue: RecommendedVenueFields) => void;
};

export function RecommendedVenueForm({
    venue,
    onSubmit,
}: RecommendedVenueFormProps) {
    const [name, setName] = useState(venue?.name ?? "");
    const [priority, setPriority] = useState(
        normalizeVenuePriority(venue?.priority) ?? VENUE_PRIORITY_OPTIONS[0]
    );

    const [mealTypeOption, setMealTypeOption] = useState(
        resolveControlledOption(MEAL_TYPE_OPTIONS, venue?.mealType)
    );
    const [mealTypeCustom, setMealTypeCustom] = useState(
        isOtherOption(resolveControlledOption(MEAL_TYPE_OPTIONS, venue?.mealType))
            ? (venue?.mealType ?? "")
            : ""
    );

    const [subtypeOption, setSubtypeOption] = useState(
        resolveControlledOption(VENUE_SUBTYPE_OPTIONS, venue?.subtype)
    );
    const [subtypeCustom, setSubtypeCustom] = useState(
        isOtherOption(resolveControlledOption(VENUE_SUBTYPE_OPTIONS, venue?.subtype))
            ? (venue?.subtype ?? "")
            : ""
    );

    const [smartChip, setSmartChip] = useState(venue?.smartChip ?? "");
    const [mapLink, setMapLink] = useState(venue?.mapLink ?? "");
    const [price, setPrice] = useState(venue?.price ?? "");
    const [reservation, setReservation] = useState(venue?.reservation ?? "");
    const [recommendation, setRecommendation] = useState(
        venue?.recommendation ?? ""
    );

    function resolvedMealType(): string {
        return isOtherOption(mealTypeOption) ? mealTypeCustom : mealTypeOption;
    }

    function resolvedSubtype(): string {
        return isOtherOption(subtypeOption) ? subtypeCustom : subtypeOption;
    }

    function validate() {
        if (!name.trim()) {
            alert("Name is required.");

            return false;
        }

        const violations = (
            [
                ["activityTitle", name],
                ["price", price],
                ["mapLink", mapLink],
            ] as const
        ).filter(([field, value]) => exceedsTextLimit(value, field));

        if (violations.length > 0) {
            const message = violations
                .map(
                    ([field, value]) =>
                        `${TEXT_LIMIT_LABELS[field]} (${formatCharacterCounter(value, field)})`
                )
                .join("\n");

            alert(
                `The following fields exceed the maximum allowed length:\n${message}`
            );

            return false;
        }

        return true;
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        const mealType = resolvedMealType();

        onSubmit({
            name,
            priority,
            // `type` is not a separately user-editable field: it continues to
            // mirror `mealType` on save, matching the importer's own
            // behavior of copying the same source cell into both fields. An
            // existing row whose `type` diverges from `mealType` (only
            // possible via data edited outside the app) is preserved as-is
            // when this form was never opened, but any explicit save always
            // re-syncs `type` to the current `mealType`.
            type: mealType,
            mealType,
            subtype: resolvedSubtype(),
            smartChip,
            mapLink,
            price,
            reservation,
            recommendation,
        });
    }

    return (
        <form className="tc-trip-form" onSubmit={handleSubmit}>
            <Stack gap="md">
                <label>
                    Name
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <span className={counterClassName(name, "activityTitle")}>
                        {formatCharacterCounter(name, "activityTitle")}
                    </span>
                </label>

                <label>
                    Priority
                    <select
                        value={priority}
                        onChange={(event) =>
                            setPriority(
                                event.target.value as typeof priority
                            )
                        }
                    >
                        {VENUE_PRIORITY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Meal Type
                    <select
                        value={mealTypeOption}
                        onChange={(event) =>
                            setMealTypeOption(
                                event.target.value as typeof mealTypeOption
                            )
                        }
                    >
                        {MEAL_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>
                {isOtherOption(mealTypeOption) && (
                    <label>
                        Custom Meal Type
                        <input
                            type="text"
                            value={mealTypeCustom}
                            onChange={(event) =>
                                setMealTypeCustom(event.target.value)
                            }
                        />
                    </label>
                )}

                <label>
                    Subtype
                    <select
                        value={subtypeOption}
                        onChange={(event) =>
                            setSubtypeOption(
                                event.target.value as typeof subtypeOption
                            )
                        }
                    >
                        {VENUE_SUBTYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>
                {isOtherOption(subtypeOption) && (
                    <label>
                        Custom Subtype
                        <input
                            type="text"
                            value={subtypeCustom}
                            onChange={(event) =>
                                setSubtypeCustom(event.target.value)
                            }
                        />
                    </label>
                )}

                <label>
                    Smart Chip
                    <input
                        type="text"
                        value={smartChip}
                        onChange={(event) => setSmartChip(event.target.value)}
                    />
                </label>

                <label>
                    Map Link
                    <input
                        type="text"
                        value={mapLink}
                        onChange={(event) => setMapLink(event.target.value)}
                    />
                    <span className={counterClassName(mapLink, "mapLink")}>
                        {formatCharacterCounter(mapLink, "mapLink")}
                    </span>
                </label>

                <label>
                    Price/person
                    <input
                        type="text"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                    />
                    <span className={counterClassName(price, "price")}>
                        {formatCharacterCounter(price, "price")}
                    </span>
                </label>

                <label>
                    Reservation
                    <input
                        type="text"
                        value={reservation}
                        onChange={(event) => setReservation(event.target.value)}
                    />
                </label>

                <label>
                    Recommendation
                    <input
                        type="text"
                        value={recommendation}
                        onChange={(event) =>
                            setRecommendation(event.target.value)
                        }
                    />
                </label>

                <Button type="submit">Save Venue</Button>
            </Stack>
        </form>
    );
}
