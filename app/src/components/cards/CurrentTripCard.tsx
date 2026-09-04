import type { CSSProperties } from "react";

import { Card, Button, Icon, Stack } from "../ui";

import "./CurrentTripCard.css";

import type { Trip } from "../../types";

import { formatDate } from "../../utils/formatDate";
import { getCountryFlag } from "../../utils/getCountryFlag";

import { HERO_BACKGROUND_URL } from "../../styles/brandAssets";

const heroCardStyle = {
    "--tc-hero-artwork": `url("${HERO_BACKGROUND_URL}")`,
} as CSSProperties;

type CurrentTripCardProps = {
    trip: Trip;
    onContinue: () => void;
};

export function CurrentTripCard({
    trip,
    onContinue,
}: CurrentTripCardProps) {
    return (
        <Card className="current-trip-card" style={heroCardStyle}>
            <Stack gap="md">
                <div className="current-trip-card-content">
                    <div className="trip-header">
                        <h2 title={trip.destination}>
                            <span className="trip-flag" aria-hidden="true">
                                {getCountryFlag(trip.country)}
                            </span>
                            {trip.destination}
                        </h2>

                        <span className="trip-status">
                            <span className="status-dot" />
                            Active
                        </span>
                    </div>

                    <p>
                        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                    </p>

                    <p>
                        <Icon name="usersRound" width={16} height={16} /> {trip.travellers} travellers
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={onContinue}
                >
                    Continue Trip
                </Button>
            </Stack>
        </Card>
    );
}