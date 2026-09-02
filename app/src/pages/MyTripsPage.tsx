import { useState } from "react";

import { Button, Container } from "../components/ui";
import { TripsSection } from "../components/sections";
import { NewTripModal } from "../components/trips";
import "./MyTripsPage.css";

export default function MyTripsPage() {
    const [newTripOpen, setNewTripOpen] = useState(false);
    const [, refreshTrips] = useState(0);

    return (
        <Container>
            <div className="my-trips-header">
                <Button
                    variant="success"
                    onClick={() => setNewTripOpen(true)}
                >
                    + New Trip
                </Button>
            </div>

            <TripsSection
                onTripChanged={() => refreshTrips(value => value + 1)}
            />

            <NewTripModal
                open={newTripOpen}
                onClose={() => setNewTripOpen(false)}
                onTripCreated={() => refreshTrips(value => value + 1)}
            />
        </Container>
    );
}
