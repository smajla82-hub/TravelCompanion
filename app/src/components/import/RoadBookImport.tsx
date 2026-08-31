import { useState } from "react";

import {
    Button,
    Card,
    Stack,
} from "../ui";

import { importXlsxRoadBook } from
    "../../services/import/XlsxRoadBookImporter";

import { TripService } from
    "../../services/TripService";

import type {
    ItineraryDay,
} from "../../types";

import { RoadBookPreview } from
    "./RoadBookPreview";

export function RoadBookImport() {

    const trips =
        TripService.getAll();

    const [selectedTripId, setSelectedTripId] =
        useState("");

    const [days, setDays] =
        useState<ItineraryDay[]>([]);

    const [error, setError] =
        useState("");

    const [fileName, setFileName] =
        useState("");

    const [saved, setSaved] =
        useState(false);

    async function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");
        setSaved(false);
        setDays([]);
        setFileName(file.name);

        try {
            const imported =
                await importXlsxRoadBook(file);

            setDays(imported);
        } catch {
            setError(
                "Unable to import the selected XLSX file."
            );
        }
    }

    function handleSave() {

        if (!selectedTripId) {
            setError(
                "Please select a Trip before saving."
            );
            return;
        }

        if (days.length === 0) {
            return;
        }

        TripService.setItinerary(
            selectedTripId,
            days
        );

        setError("");
        setSaved(true);
    }

    function handleClear() {
        setDays([]);
        setFileName("");
        setError("");
        setSaved(false);
    }

    const itemCount =
        days.reduce(
            (total, day) =>
                total + day.items.length,
            0
        );

    return (
        <Card>
            <Stack gap="md">

                <h2>
                    Import RoadBook
                </h2>

                <label>
                    Trip
                </label>

                <select
                    value={selectedTripId}
                    onChange={(event) => {
                        setSelectedTripId(
                            event.target.value
                        );
                        setSaved(false);
                        setError("");
                    }}
                >
                    <option value="">
                        Select Trip
                    </option>

                    {trips.map((trip) => (
                        <option
                            key={trip.id}
                            value={trip.id}
                        >
                            {trip.destination}
                            {" — "}
                            {trip.startDate}
                            {" – "}
                            {trip.endDate}
                        </option>
                    ))}
                </select>

                <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                />

                {fileName && (
                    <p>
                        File: {fileName}
                    </p>
                )}

                {days.length > 0 && (
                    <p>
                        Imported {days.length} days
                        {" · "}
                        {itemCount} activities
                    </p>
                )}

                {error && (
                    <p>
                        {error}
                    </p>
                )}

                {saved && (
                    <p>
                        RoadBook saved to Trip.
                    </p>
                )}

                {days.length > 0 && (
                    <Stack gap="sm">

                        <Button
                            type="button"
                            onClick={handleSave}
                        >
                            Save to Trip
                        </Button>

                        <Button
                            type="button"
                            onClick={handleClear}
                        >
                            Clear Import
                        </Button>

                    </Stack>
                )}

                <RoadBookPreview
                    days={days}
                />

            </Stack>
        </Card>
    );
}