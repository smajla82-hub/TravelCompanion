import { useState } from "react";

import { Button, Container, Heading, Icon } from "../components/ui";
import { TripsSection } from "../components/sections";
import { NewTripModal } from "../components/trips";
import { TRIPS_BACKGROUND_URL } from "../styles/brandAssets";
import type { CSSProperties } from "react";
import "./MyTripsPage.css";

const pageStyle = {
    "--tc-my-trips-artwork": `url("${TRIPS_BACKGROUND_URL}")`,
} as CSSProperties;

export default function MyTripsPage() {
    const [newTripOpen, setNewTripOpen] = useState(false);
    const [, refreshTrips] = useState(0);

    return (
        <Container>
            <section className="my-trips-page" style={pageStyle}>
                <div className="my-trips-header">
                    <Heading level={1} className="tc-hero-title">
                        My Trips
                    </Heading>

                    <Button
                        variant="success"
                        onClick={() => setNewTripOpen(true)}
                    >
                        <Icon name="plus" width={16} height={16} /> New Trip
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
            </section>
        </Container>
    );
}
