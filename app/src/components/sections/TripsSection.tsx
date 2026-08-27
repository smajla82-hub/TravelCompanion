import { useState } from "react";

import {
    Grid,
    Heading,
    Modal,
} from "../ui";

import { TripCard } from "../cards";
import { TripDetail } from "../tripDetail";
import { NewTripModal } from "../trips";

import { useTrips } from "../../hooks";

import type { Trip } from "../../types";

export function TripsSection() {
    const { trips } = useTrips();

    const [selectedTrip, setSelectedTrip] =
        useState<Trip | null>(null);

    const [editingTrip, setEditingTrip] =
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
                    />
                )}
            </Modal>

            <NewTripModal
                open={editingTrip !== null}
                onClose={closeEdit}
                initialTrip={editingTrip ?? undefined}
            />
        </>
    );
}