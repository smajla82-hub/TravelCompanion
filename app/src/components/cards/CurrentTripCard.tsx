import { Card, Button, Stack } from "../ui";

import "./CurrentTripCard.css";

export function CurrentTripCard() {
    return (
        <Card>
            <Stack gap="md">
                <div className="trip-header">
                    <h2>🇮🇹 Lago di Garda</h2>

                    <span className="trip-status">
                        Active Trip
                    </span>
                </div>

                <p>15. 7. 2026 – 20. 7. 2026</p>

                <p>👥 4 travellers</p>

                <Button>
                    Continue Trip
                </Button>
            </Stack>
        </Card>
    );
}