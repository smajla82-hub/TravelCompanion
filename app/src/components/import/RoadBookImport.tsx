import { useState } from "react";

import { Button, Card, Stack } from "../ui";

import { importXlsxRoadBook } from "../../services/import/XlsxRoadBookImporter";

import type { ItineraryDay } from "../../types";

import { RoadBookPreview } from "./RoadBookPreview";

export function RoadBookImport() {

    const [days, setDays] =
        useState<ItineraryDay[]>([]);

    const [error, setError] =
        useState("");

    const [fileName, setFileName] =
        useState("");

    async function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");
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

                {days.length > 0 && (
                    <Button
                        type="button"
                        onClick={() =>
                            setDays([])
                        }
                    >
                        Clear Import
                    </Button>
                )}

                <RoadBookPreview
                    days={days}
                />

            </Stack>
        </Card>
    );
}