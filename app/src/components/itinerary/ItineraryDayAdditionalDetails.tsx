import { useState } from "react";

import { Button, Card, Stack } from "../ui";
import { RecommendedVenueManageRow } from "./RecommendedVenueManageRow";
import { RecommendedVenueModal } from "./RecommendedVenueModal";
import { RecommendedVenueActionsModal } from
    "./RecommendedVenueActionsModal";
import { ParkingLocationManageRow } from "./ParkingLocationManageRow";
import { ParkingLocationModal } from "./ParkingLocationModal";
import { ParkingLocationActionsModal } from
    "./ParkingLocationActionsModal";
import { VenueParkingActionsRow } from "./VenueParkingActionsRow";
import "./ItineraryDayAdditionalDetails.css";
import {
    MAX_VENUES_PER_DAY,
    MAX_PARKING_PER_DAY,
} from "../../domain/itinerary/venueParkingLimits";

import type {
    ItineraryDay,
    RecommendedVenue,
    ParkingLocation,
} from "../../types";
import type { TripAdapter } from "../../services/TripAdapter";

type ItineraryDayAdditionalDetailsProps = {
    day: ItineraryDay;
    adapter?: TripAdapter;
    editable?: boolean;
    onDayChanged?: () => void;
};

export function ItineraryDayAdditionalDetails({
    day,
    adapter,
    editable = false,
    onDayChanged = () => {},
}: ItineraryDayAdditionalDetailsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const [venueModalOpen, setVenueModalOpen] = useState(false);
    const [editingVenue, setEditingVenue] =
        useState<RecommendedVenue | undefined>();
    const [venueActionsId, setVenueActionsId] =
        useState<string | null>(null);

    const [parkingModalOpen, setParkingModalOpen] = useState(false);
    const [editingParking, setEditingParking] =
        useState<ParkingLocation | undefined>();
    const [parkingActionsId, setParkingActionsId] =
        useState<string | null>(null);

    const venues = day.venues ?? [];
    const parkingLocations = day.parkingLocations ?? [];

    const venueInActions = venueActionsId
        ? venues.find(venue => venue.id === venueActionsId)
        : undefined;

    const parkingInActions = parkingActionsId
        ? parkingLocations.find(
              parking => parking.id === parkingActionsId
          )
        : undefined;

    const referencingItems = parkingInActions
        ? day.items.filter(
              item => item.parking === parkingInActions.code
          )
        : [];

    if (
        venues.length === 0 &&
        parkingLocations.length === 0 &&
        !editable
    ) {
        return null;
    }

    async function handleVenueSubmit(fields: Omit<RecommendedVenue, "id">) {
        if (editingVenue) {
            if (adapter) {
                await adapter.updateVenue(day, editingVenue.id, fields);
            }
        } else {
            if (adapter) await adapter.addVenue(day, fields);
        }

        setVenueModalOpen(false);
        setEditingVenue(undefined);
        onDayChanged();
    }

    async function handleVenueDelete(venueId: string) {
        if (!window.confirm("Delete this recommended venue?")) {
            return;
        }

        if (adapter) await adapter.deleteVenue(day, venueId);

        onDayChanged();
    }

    async function handleParkingSubmit(fields: Omit<ParkingLocation, "id">) {
        if (editingParking) {
            if (adapter) {
                await adapter.updateParking(day, editingParking.id, fields);
            }
        } else {
            if (adapter) await adapter.addParking(day, fields);
        }

        setParkingModalOpen(false);
        setEditingParking(undefined);
        onDayChanged();
    }

    async function handleParkingDelete(parkingId: string) {
        if (!window.confirm("Delete this parking location?")) {
            return;
        }

        if (adapter) await adapter.deleteParking(day, parkingId);

        onDayChanged();
    }

    return (
        <Stack gap="md">
            <Button
                type="button"
                variant="subtle-success"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen
                    ? "Hide details"
                    : "Recommended venues & parking"}
            </Button>

            {isOpen && (
                <Card variant="outlined">
                    <Stack gap="md">
                        <div>
                            <div className="itinerary-list-summary">
                                <strong>
                                Recommended venues
                                </strong>
                                {" "}
                                <span>
                                    ({venues.length}/{MAX_VENUES_PER_DAY})
                                </span>
                            </div>

                            {venues.length > 0 && (
                                <Stack gap="sm">
                                    {venues.map((venue) => (
                                        <RecommendedVenueManageRow
                                            key={venue.id}
                                            venue={venue}
                                            editable={editable}
                                            onManage={() =>
                                                setVenueActionsId(venue.id)
                                            }
                                        />
                                    ))}
                                </Stack>
                            )}
                        </div>

                        <div>
                            <div className="itinerary-list-summary">
                                <strong>
                                    Parking
                                </strong>
                                {" "}
                                <span>
                                    ({parkingLocations.length}/{MAX_PARKING_PER_DAY})
                                </span>
                            </div>

                            {parkingLocations.length > 0 && (
                                <Stack gap="sm">
                                    {parkingLocations.map(
                                        (parkingLocation) => (
                                            <ParkingLocationManageRow
                                                key={parkingLocation.id}
                                                parking={parkingLocation}
                                                editable={editable}
                                                onManage={() =>
                                                    setParkingActionsId(
                                                        parkingLocation.id
                                                    )
                                                }
                                            />
                                        )
                                    )}
                                </Stack>
                            )}
                        </div>

                        {editable && (
                            <VenueParkingActionsRow
                                venueCount={venues.length}
                                parkingCount={parkingLocations.length}
                                onAddParking={() => {
                                    setEditingParking(undefined);
                                    setParkingModalOpen(true);
                                }}
                                onAddVenue={() => {
                                    setEditingVenue(undefined);
                                    setVenueModalOpen(true);
                                }}
                            />
                        )}
                    </Stack>
                </Card>
            )}

            <RecommendedVenueModal
                open={venueModalOpen}
                venue={editingVenue}
                onClose={() => {
                    setVenueModalOpen(false);
                    setEditingVenue(undefined);
                }}
                onSubmit={handleVenueSubmit}
            />

            <RecommendedVenueActionsModal
                open={venueActionsId !== null}
                venue={venueInActions}
                onClose={() => setVenueActionsId(null)}
                onEdit={() => {
                    if (!venueInActions) return;

                    setEditingVenue(venueInActions);
                    setVenueModalOpen(true);
                    setVenueActionsId(null);
                }}
                onDelete={() => {
                    if (!venueInActions) return;

                    handleVenueDelete(venueInActions.id);
                    setVenueActionsId(null);
                }}
            />

            <ParkingLocationModal
                open={parkingModalOpen}
                parking={editingParking}
                existingCodes={parkingLocations.map(
                    parking => parking.code
                )}
                onClose={() => {
                    setParkingModalOpen(false);
                    setEditingParking(undefined);
                }}
                onSubmit={handleParkingSubmit}
            />

            <ParkingLocationActionsModal
                open={parkingActionsId !== null}
                parking={parkingInActions}
                referencingItems={referencingItems}
                onClose={() => setParkingActionsId(null)}
                onEdit={() => {
                    if (!parkingInActions) return;

                    setEditingParking(parkingInActions);
                    setParkingModalOpen(true);
                    setParkingActionsId(null);
                }}
                onDelete={() => {
                    if (!parkingInActions) return;

                    handleParkingDelete(parkingInActions.id);
                    setParkingActionsId(null);
                }}
            />
        </Stack>
    );
}
