import { useId, useRef, useState } from "react";

import { RoadBookImport } from "../components/import";

import {
    Button,
    Card,
    Container,
    Heading,
    Icon,
    Stack,
} from "../components/ui";

import { ThemeService } from "../services/ThemeService";
import { TripService } from "../services/TripService";

import type { Theme } from "../services/ThemeService";
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

    const importInputId =
        useId();

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

    function selectTheme(nextTheme: Theme) {
        if (nextTheme === theme) {
            return;
        }

        ThemeService.setTheme(nextTheme);
        setTheme(nextTheme);
    }

    return (
        <Container>
            <Stack gap="lg">

                <Heading level={1}>
                    Settings
                </Heading>

                <RoadBookImport
                    key={roadBookImportKey}
                />

                <Card>
                    <Stack gap="md">
                        <Heading level={2}>
                            Appearance
                        </Heading>

                        <p>
                            Choose how Travel Companion looks on this device.
                        </p>

                        <div
                            className="settings-theme-switch"
                            role="group"
                            aria-label="Theme"
                        >
                            <Button
                                type="button"
                                variant={theme === "light" ? "success" : "outline"}
                                aria-pressed={theme === "light"}
                                onClick={() => selectTheme("light")}
                            >
                                <Icon name="sun" width={16} height={16} />
                                Light
                                {theme === "light" && (
                                    <Icon name="circleCheck" width={16} height={16} />
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant={theme === "dark" ? "success" : "outline"}
                                aria-pressed={theme === "dark"}
                                onClick={() => selectTheme("dark")}
                            >
                                <Icon name="moon" width={16} height={16} />
                                Dark
                                {theme === "dark" && (
                                    <Icon name="circleCheck" width={16} height={16} />
                                )}
                            </Button>
                        </div>
                    </Stack>
                </Card>

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

                        <label
                            className="settings-file-label"
                            htmlFor={importInputId}
                        >
                            Backup file (.json)
                        </label>

                        <input
                            id={importInputId}
                            ref={fileInputRef}
                            type="file"
                            accept=".json,application/json"
                            onChange={handleImportBackup}
                        />

                        {importMessage && (
                            <p className="settings-status settings-status--success" role="status">
                                <Icon name="circleCheck" width={16} height={16} />
                                {importMessage}
                            </p>
                        )}

                        {importError && (
                            <p className="settings-status settings-status--error" role="alert">
                                <Icon name="circleAlert" width={16} height={16} />
                                {importError}
                            </p>
                        )}
                    </Stack>
                </Card>

            </Stack>
        </Container>
    );
}
