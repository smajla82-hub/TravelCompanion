import { useEffect, useState } from "react";

import { Modal, Button, Stack } from "../ui";
import "./NewTripModal.css";

import type { Trip } from "../../types";
import { TripService } from "../../services/TripService";
import { AuthService } from "../../services/AuthService";
import { SyncedTripApi } from "../../api/trips";
import { createTripAdapter } from "../../services/TripAdapter";
import { OnlineTripStore } from "../../services/OnlineTripStore";
import {
    counterClassName,
    exceedsTextLimit,
    formatCharacterCounter,
    TEXT_LIMIT_LABELS,
} from "../../domain/validation/textLimits";

type NewTripModalProps = {
    open: boolean;
    onClose: () => void;
    onTripCreated?: () => void;
    initialTrip?: Trip;
};

export function NewTripModal({
    open,
    onClose,
    onTripCreated,
    initialTrip,
}: NewTripModalProps) {

    const [destination, setDestination] =
        useState(initialTrip?.destination ?? "");

    const [country, setCountry] =
        useState(initialTrip?.country ?? "");

    const [startDate, setStartDate] =
        useState(initialTrip?.startDate ?? "");

    const [endDate, setEndDate] =
        useState(initialTrip?.endDate ?? "");

    const [travellers, setTravellers] =
        useState(initialTrip?.travellers ?? 1);
    const [online, setOnline] = useState(false);

    // Form state is intentionally reset when the modal switches trips.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!open) {
            return;
        }

        setDestination(initialTrip?.destination ?? "");
        setCountry(initialTrip?.country ?? "");
        setStartDate(initialTrip?.startDate ?? "");
        setEndDate(initialTrip?.endDate ?? "");
        setTravellers(initialTrip?.travellers ?? 1);
        setOnline(initialTrip?.source === "online");
    }, [open, initialTrip]);
    /* eslint-enable react-hooks/set-state-in-effect */

    async function handleSave() {

        if (!destination || !country) {
            alert("Destination and country are required.");
            return;
        }

        if (exceedsTextLimit(destination, "tripName")) {
            alert(
                `${TEXT_LIMIT_LABELS.tripName} exceeds the maximum allowed length (${formatCharacterCounter(destination, "tripName")}).`
            );
            return;
        }

        if (!startDate || !endDate) {
            alert("Both dates are required.");
            return;
        }

        if (endDate < startDate) {
            alert("End date cannot be before start date.");
            return;
        }

        if (initialTrip) {

            const updatedTrip: Trip = {
                ...initialTrip,
                destination,
                country,
                startDate,
                endDate,
                travellers,
            };

            if (initialTrip.source === "online") {
                const saved = await createTripAdapter(initialTrip).updateTrip({
                    ...initialTrip,
                    name: initialTrip.name ?? destination,
                    destination,
                    country,
                    startDate,
                    endDate,
                    travellers,
                });
                OnlineTripStore.applyTrip(saved);
            } else {
                TripService.update(updatedTrip);
            }

        } else {

            const trip: Trip = {
                id: crypto.randomUUID(),
                destination,
                country,
                startDate,
                endDate,
                travellers,
                coverImage: "",
                status: "planning",
            };

            if (online && AuthService.getToken()) {
                await SyncedTripApi.create({
                    ...trip,
                    name: destination,
                });
                await OnlineTripStore.refresh();
            } else {
                TripService.add(trip);
            }
        }

        onTripCreated?.();
        onClose();
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={initialTrip ? "Edit Trip" : "New Trip"}
        >
            <Stack
                gap="md"
                className="tc-trip-form"
            >

                <label>
                    Destination

                    <input
                        type="text"
                        value={destination}
                        onChange={event =>
                            setDestination(event.target.value)
                        }
                        placeholder="Lago di Garda"
                    />

                    <span className={counterClassName(destination, "tripName")}>
                        {formatCharacterCounter(destination, "tripName")}
                    </span>
                </label>

                <label>
                    Country

                    <input
                        type="text"
                        value={country}
                        onChange={event =>
                            setCountry(event.target.value)
                        }
                        placeholder="Italy"
                    />
                </label>

                <label>
                    Start Date

                    <input
                        type="date"
                        value={startDate}
                        onChange={event =>
                            setStartDate(event.target.value)
                        }
                    />
                </label>

                <label>
                    End Date

                    <input
                        type="date"
                        value={endDate}
                        onChange={event =>
                            setEndDate(event.target.value)
                        }
                    />
                </label>

                <label>
                    Travellers

                    <input
                        type="number"
                        min={1}
                        value={travellers}
                        onChange={event =>
                            setTravellers(Number(event.target.value))
                        }
                    />
                </label>

                {!initialTrip && AuthService.getToken() && (
                    <label>
                        Trip storage
                        <select
                            value={online ? "online" : "offline"}
                            onChange={event => setOnline(event.target.value === "online")}
                        >
                            <option value="offline">Offline</option>
                            <option value="online">Online</option>
                        </select>
                    </label>
                )}

                <Button
                    type="button"
                    onClick={handleSave}
                >
                    Save Trip
                </Button>

            </Stack>
        </Modal>
    );
}