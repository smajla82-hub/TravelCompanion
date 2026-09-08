import { useState } from "react";

import { Button, Icon, Stack } from "../ui";
import "../trips/NewTripModal.css";

import type { ParkingLocation } from "../../types";
import {
    availableParkingCodes,
} from "../../domain/itinerary/venueParkingLimits";
import {
    TEXT_LIMIT_LABELS,
    counterClassName,
    exceedsTextLimit,
    formatCharacterCounter,
} from "../../domain/validation/textLimits";
import { openMapSearch } from "../../utils/mapSearchUrl";

export type ParkingLocationFields = Omit<ParkingLocation, "id">;

type ParkingLocationFormProps = {
    parking?: ParkingLocation;
    /** Codes already used by other parking locations in the same day. */
    existingCodes: readonly string[];
    onSubmit: (parking: ParkingLocationFields) => void;
};

export function ParkingLocationForm({
    parking,
    existingCodes,
    onSubmit,
}: ParkingLocationFormProps) {
    const isEdit = Boolean(parking);

    // Only codes not already used by another parking location in this day
    // are selectable when creating a new one.
    const selectableCodes = availableParkingCodes(existingCodes);

    const [code, setCode] = useState(
        parking?.code ?? selectableCodes[0] ?? ""
    );
    const [name, setName] = useState(parking?.name ?? "");
    const [smartChip, setSmartChip] = useState(parking?.smartChip ?? "");
    const [mapLink, setMapLink] = useState(parking?.mapLink ?? "");
    const [price, setPrice] = useState(parking?.price ?? "");
    const [note, setNote] = useState(parking?.note ?? "");

    function validate() {
        if (!code) {
            alert("A parking code (P1-P8) is required.");

            return false;
        }

        if (!name.trim()) {
            alert("Name is required.");

            return false;
        }

        const violations = (
            [
                ["price", price],
                ["note", note],
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

        onSubmit({
            code,
            name,
            smartChip,
            mapLink,
            price,
            note,
        });
    }

    function handleFindOnMap() {
        openMapSearch(smartChip);
    }

    return (
        <form className="tc-trip-form" onSubmit={handleSubmit}>
            <Stack gap="md">
                <label>
                    Code
                    {/*
                        A parking code is read-only once created: changing it
                        would require rewriting every ItineraryItem.parking
                        reference for the day, which this feature
                        intentionally does not support yet (see FP-2 plan).
                    */}
                    {isEdit ? (
                        <input type="text" value={code} disabled readOnly />
                    ) : (
                        <select
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                        >
                            {selectableCodes.length === 0 && (
                                <option value="">
                                    No codes available (8/8 used)
                                </option>
                            )}
                            {selectableCodes.map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    )}
                </label>

                <label>
                    Name
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </label>

                <label>
                    Smart Chip
                    <input
                        type="text"
                        value={smartChip}
                        onChange={(event) => setSmartChip(event.target.value)}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        compact
                        disabled={!smartChip.trim()}
                        onClick={handleFindOnMap}
                    >
                        <Icon name="mapPin" width={16} height={16} /> Find on Map
                    </Button>
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
                    Price
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
                    Note
                    <input
                        type="text"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                    />
                    <span className={counterClassName(note, "note")}>
                        {formatCharacterCounter(note, "note")}
                    </span>
                </label>

                <Button type="submit" disabled={!isEdit && !code}>
                    Save Parking
                </Button>
            </Stack>
        </form>
    );
}
