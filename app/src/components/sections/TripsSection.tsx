import { useState } from "react";

import {
    Grid,
    Heading,
    Modal,
    Stack,
    Button,
} from "../ui";

import { TripCard } from "../cards";
import { TripDetail } from "../tripDetail";
import { NewTripModal } from "../trips";

import { useTrips } from "../../hooks";

import { TripService } from "../../services/TripService";

import type { Trip } from "../../types";

type TripsSectionProps = {
    onTripChanged?: () => void;
};

export function TripsSection({
    onTripChanged,
}: TripsSectionProps) {

    const { trips } = useTrips();

    const [selectedTrip, setSelectedTrip] =
        useState<Trip | null>(null);

    const [editingTrip, setEditingTrip] =
        useState<Trip | null>(null);

    const [deletingTrip, setDeletingTrip] =
        useState<Trip | null>(null);

    function closeDetail() {
        setSelectedTrip(null);
    }

    function openEdit() {
        if (!selectedTrip) {
            return;
        }

        setEditingTrip(selectedTrip);
        setSelectedTrip(null);
    }

    function closeEdit() {
        setEditingTrip(null);
    }

    function openDelete() {
        if (!selectedTrip) {
            return;
        }

        setDeletingTrip(selectedTrip);
        setSelectedTrip(null);
    }

    function closeDelete() {
        setDeletingTrip(null);
    }

    function confirmDelete() {
        if (!deletingTrip) {
            return;
        }

        TripService.delete(deletingTrip.id);

        setDeletingTrip(null);
        onTripChanged?.();
    }

    function setActiveTrip() {
        if (!selectedTrip) {
            return;
        }

        TripService.setActive(selectedTrip.id);

        setSelectedTrip(null);
        onTripChanged?.();
    }

    return (
        <>
            <Heading level={2}>
                My Trips
            </Heading>

            <Grid>
                {trips.map((trip) => (
                    <TripCard
                        key={trip.id}
                        trip={trip}
                        onClick={() =>
                            setSelectedTrip(trip)
                        }
                    />
                ))}
            </Grid>

            <Modal
                open={selectedTrip !== null}
                title="Trip Detail"
                onClose={closeDetail}
            >
                {selectedTrip && (
                    <TripDetail
                        trip={selectedTrip}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        onSetActive={setActiveTrip}
                    />
                )}
            </Modal>

            <NewTripModal
                open={editingTrip !== null}
                onClose={closeEdit}
                initialTrip={
                    editingTrip ?? undefined
                }
                onTripCreated={onTripChanged}
            />

            <Modal
                open={deletingTrip !== null}
                title="Delete Trip"
                onClose={closeDelete}
            >
                {deletingTrip && (
                    <>
                        <p>
                            Are you sure you want to delete{" "}
                            <strong>
                                {deletingTrip.destination}
                            </strong>
                            ?
                        </p>

                        <Stack gap="sm">

                            <Button
                                type="button"
                                onClick={confirmDelete}
                            >
                                Delete
                            </Button>

                            <Button
                                type="button"
                                onClick={closeDelete}
                            >
                                Cancel
                            </Button>

                        </Stack>
                    </>
                )}
            </Modal>
        </>
    );
}