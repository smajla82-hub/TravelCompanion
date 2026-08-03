import { useState } from "react";

import { Modal, Button, Stack } from "../ui";

import { TripService } from "../../services/TripService";

import {
    NewTripForm,
} from ".";

import type { Trip } from "../../types";

import "./NewTripModal.css";

type NewTripModalProps = {
    open: boolean;
    onClose: () => void;
    onTripCreated?: () => void;
};

export function NewTripModal({
    open,
    onClose,
    onTripCreated,
}: NewTripModalProps) {

    const [destination, setDestination] = useState("");
    const [country, setCountry] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [travellers, setTravellers] = useState(1);

    function handleSave() {

        if (!destination.trim()) {
            alert("Destination is required.");
            return;
        }

        if (!country.trim()) {
            alert("Country is required.");
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

        TripService.add(trip);

        onTripCreated?.();

        setDestination("");
        setCountry("");
        setStartDate("");
        setEndDate("");
        setTravellers(1);

        onClose();
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="New Trip"
        >
            <NewTripForm>

                <Stack gap="md">

                    <label>
                        Destination
                        <input
                            value={destination}
                            onChange={e => setDestination(e.target.value)}
                        />
                    </label>

                    <label>
                        Country
                        <input
                            value={country}
                            onChange={e => setCountry(e.target.value)}
                        />
                    </label>

                    <label>
                        Start Date
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </label>

                    <label>
                        End Date
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </label>

                    <label>
                        Travellers
                        <input
                            type="number"
                            min={1}
                            value={travellers}
                            onChange={e => setTravellers(Number(e.target.value))}
                        />
                    </label>

                    <Button 
                    type="button"
                    onClick={handleSave}>
                        Save Trip
                    </Button>

                </Stack>

            </NewTripForm>
        </Modal>
    );
}