import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

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
import { AuthService } from "../../services/AuthService";
import { SyncedTripApi } from "../../api/trips";
import { ApiError } from "../../api/client";
import { createTripAdapter } from "../../services/TripAdapter";
import { OnlineTripStore } from "../../services/OnlineTripStore";

import type { Trip } from "../../types";

type TripsSectionProps = {
    onTripChanged?: () => void;
};

export function TripsSection({
    onTripChanged,
}: TripsSectionProps) {

    const navigate = useNavigate();

    const { trips: allTrips, onlineTrips: syncedTrips } = useTrips();
    const trips = allTrips.filter(trip => trip.source !== "online");
    const [syncedError, setSyncedError] = useState("");

    useEffect(() => {
        if (!AuthService.getToken()) {
            return;
        }
        void OnlineTripStore.ensureLoaded().catch(reason => setSyncedError(
            reason instanceof ApiError ? reason.message : "Unable to load online trips.",
        ));
    }, []);

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

    async function confirmDelete() {
        if (!deletingTrip) {
            return;
        }

        if (deletingTrip.source === "online") {
            try {
                await SyncedTripApi.delete(deletingTrip.id);
                OnlineTripStore.remove(deletingTrip.id);
            } catch (reason) {
                setSyncedError(reason instanceof ApiError ? reason.message : "Unable to delete online trip.");
                return;
            }
        } else {
            TripService.delete(deletingTrip.id);
        }

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
        navigate("/");
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
                {syncedTrips.map(trip => (
                    <TripCard
                        key={`online-${trip.id}`}
                        trip={{
                            ...trip,
                            destination: trip.name || trip.destination,
                        }}
                        badge="Online"
                        onClick={() => setSelectedTrip(trip)}
                    />
                ))}
            </Grid>
            {syncedError && <p role="alert">{syncedError}</p>}

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
                        onSetActive={() => {
                            if (selectedTrip.source === "online") {
                                void createTripAdapter(selectedTrip)
                                    .setActive()
                                    .then(activatedTrip => {
                                        OnlineTripStore.applyTrip(activatedTrip);
                                        setSelectedTrip(null);
                                        onTripChanged?.();
                                        navigate("/");
                                    })
                                    .catch(reason => setSyncedError(reason instanceof ApiError ? reason.message : "Unable to set active trip."));
                            } else {
                                setActiveTrip();
                            }
                        }}
                    />
                )}
            </Modal>

            <NewTripModal
                open={editingTrip !== null}
                onClose={closeEdit}
                initialTrip={
                    editingTrip ?? undefined
                }
                onTripCreated={() => {
                    onTripChanged?.();
                }}
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
                                onClick={() => void confirmDelete()}
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