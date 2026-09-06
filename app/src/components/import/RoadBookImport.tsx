import { useEffect, useState } from "react";

import {
    Button,
    Card,
    Stack,
} from "../ui";
import "./RoadBookImport.css";

import {
    importXlsxRoadBook,
    formatImportWarningLine,
    getImportWarningsSummary,
    type ImportWarning,
} from "../../services/import/XlsxRoadBookImporter";

import { TripService } from
    "../../services/TripService";
import { AuthService } from "../../services/AuthService";
import { SyncedTripApi, type SyncedTrip } from "../../api/trips";
import { ApiError } from "../../api/client";
import { lockConflictMessage } from "../sections/lockConflictMessage";

import type {
    ItineraryDay,
} from "../../types";

import { RoadBookPreview } from
    "./RoadBookPreview";

export function RoadBookImport() {

    const trips = TripService.getAll();
    const [syncedTrips, setSyncedTrips] = useState<SyncedTrip[]>([]);

    useEffect(() => {
        if (AuthService.getToken()) {
            void SyncedTripApi.list().then(setSyncedTrips).catch(() => setSyncedTrips([]));
        }
    }, []);

    const [selectedTripId, setSelectedTripId] =
        useState("");

    const [days, setDays] =
        useState<ItineraryDay[]>([]);

    const [warnings, setWarnings] =
        useState<ImportWarning[]>([]);

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
        setWarnings([]);
        setFileName(file.name);

        try {
            const imported =
                await importXlsxRoadBook(file);

            setDays(imported.days);
            setWarnings(imported.warnings);
        } catch {
            setError(
                "Unable to import the selected XLSX file."
            );
        }
    }

    async function handleSave() {

        if (!selectedTripId) {
            setError(
                "Please select a Trip before saving."
            );
            return;
        }

        if (days.length === 0) {
            return;
        }

        if (!selectedTripId.startsWith("online:")) {
            TripService.setItinerary(selectedTripId, days);
            setError("");
            setSaved(true);
            return;
        }

        const tripId = selectedTripId.slice("online:".length);
        let ownsLock = false;
        try {
            await SyncedTripApi.acquireLock(tripId);
            ownsLock = true;
            const existing = (await SyncedTripApi.itinerary(tripId)).days;
            for (const day of existing) {
                await SyncedTripApi.deleteDay(tripId, day.id);
            }
            for (const day of days) {
                const createdDay = await SyncedTripApi.createDay(tripId, {
                    date: day.date,
                    title: day.title,
                });
                for (const item of day.items) {
                    const payload = { ...item } as Omit<typeof item, "id">;
                    delete (payload as { id?: string }).id;
                    await SyncedTripApi.createItem(tripId, createdDay.id, payload);
                }
            }
            setError("");
            setSaved(true);
        } catch (reason) {
            setError(reason instanceof ApiError
                ? `${lockConflictMessage(reason)} Import may be partially applied; reload the Trip and retry if needed.`
                : "The online Trip itinerary could only be partially replaced. Reload the Trip and retry.");
        } finally {
            if (ownsLock) {
                await SyncedTripApi.releaseLock(tripId).catch(() => undefined);
            }
        }
    }

    function handleClear() {
        setDays([]);
        setWarnings([]);
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
                            Offline — {trip.destination}
                            {" — "}
                            {trip.startDate}
                            {" – "}
                            {trip.endDate}
                        </option>
                    ))}
                    {syncedTrips.map(trip => (
                        <option key={`online-${trip.id}`} value={`online:${trip.id}`}>
                            Online — {trip.name || trip.destination}
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

                {warnings.length > 0 && (
                    <Card variant="outlined">
                        <Stack gap="sm">
                            <strong>
                                Import completed with warnings.
                            </strong>

                            <p>
                                {getImportWarningsSummary(warnings.length)}
                            </p>

                            <ul className="tc-import-warnings">
                                {warnings.map((warning, index) => (
                                    <li key={index}>
                                        {formatImportWarningLine(warning)}
                                    </li>
                                ))}
                            </ul>
                        </Stack>
                    </Card>
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
                            onClick={() => void handleSave()}
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