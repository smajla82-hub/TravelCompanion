import { useRef, useState } from "react";

import { RoadBookImport } from "../components/import";

import {
    Button,
    Card,
    Container,
    Heading,
    Stack,
} from "../components/ui";

import { ThemeService } from "../services/ThemeService";
import { TripService } from "../services/TripService";

import type { Theme } from "../services/ThemeService";
import { Link } from "react-router-dom";
import "./SettingsPage.css";

export default function SettingsPage() {

    const [theme, setTheme] =
        useState<Theme>(
            ThemeService.getTheme()
        );

    const [importMessage, setImportMessage] =
        useState("");

    const [importError, setImportError] =
        useState("");

    const [roadBookImportKey, setRoadBookImportKey] =
        useState(0);

    const fileInputRef =
        useRef<HTMLInputElement>(null);

    function handleExportData() {
        const backup =
            TripService.exportBackup();

        const blob =
            new Blob(
                [backup],
                {
                    type: "application/json",
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        const date =
            new Date().toISOString().slice(0, 10);

        link.href =
            url;
        link.download =
            `travel-companion-backup-${date}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    async function handleImportBackup(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setImportMessage("");
        setImportError("");

        const json =
            await file.text();

        if (
            !window.confirm(
                "This will overwrite all current data. Continue?"
            )
        ) {
            clearFileInput();
            return;
        }

        const result =
            TripService.importBackup(json);

        if (!result.success) {
            setImportError(
                result.error ?? "Invalid backup file."
            );
            clearFileInput();
            return;
        }

        setImportMessage(
            "Backup imported successfully."
        );
        setRoadBookImportKey(value => value + 1);
        clearFileInput();
    }

    function clearFileInput() {
        if (!fileInputRef.current) {
            return;
        }

        fileInputRef.current.value =
            "";
    }

    function toggleTheme() {
        const nextTheme =
            theme === "light"
                ? "dark"
                : "light";

        ThemeService.setTheme(nextTheme);
        setTheme(nextTheme);
    }

    return (
        <Container>
            <Stack gap="lg">

                <Heading level={1}>
                    Settings
                </Heading>
                <Link to="/" className="settings-back">← Back to Home</Link>

                <RoadBookImport
                    key={roadBookImportKey}
                />

                <Card>
                    <Stack gap="md">
                        <Heading level={2}>
                            Export data
                        </Heading>

                        <p>
                            Download a JSON backup of all Trips.
                        </p>

                        <Button
                            type="button"
                            onClick={handleExportData}
                        >
                            Export data
                        </Button>
                    </Stack>
                </Card>

                <Card>
                    <Stack gap="md">
                        <Heading level={2}>
                            Import backup
                        </Heading>

                        <p>
                            Restore Trips from a JSON backup file.
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,application/json"
                            onChange={handleImportBackup}
                        />

                        {importMessage && (
                            <p>
                                {importMessage}
                            </p>
                        )}

                        {importError && (
                            <p>
                                {importError}
                            </p>
                        )}
                    </Stack>
                </Card>

                <Card>
                    <Stack gap="md">
                        <Heading level={2}>
                            Appearance
                        </Heading>

                        <p>
                            Current mode: {theme}
                        </p>

                        <Button
                            type="button"
                            onClick={toggleTheme}
                        >
                            {theme === "light"
                                ? "Switch to Dark Mode"
                                : "Switch to Light Mode"}
                        </Button>
                    </Stack>
                </Card>

            </Stack>
        </Container>
    );
}
