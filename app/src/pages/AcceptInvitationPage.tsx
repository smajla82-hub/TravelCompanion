import { useState } from "react";

import { useParams } from "react-router-dom";

import { ApiError } from "../api/client";
import { SyncedTripApi } from "../api/trips";
import { AuthService } from "../services/AuthService";
import { OnlineTripStore } from "../services/OnlineTripStore";
import { Button, Card, Container, Heading, Stack } from "../components/ui";

export default function AcceptInvitationPage() {
    const { token } = useParams();
    const [message, setMessage] = useState("");

    async function respond(action: "accept" | "reject") {
        if (!token) {
            return;
        }
        if (!AuthService.getToken()) {
            setMessage("Please log in before responding to this invitation.");
            return;
        }
        try {
            if (action === "accept") {
                await SyncedTripApi.acceptInvitation(token);
                await OnlineTripStore.refresh();
            } else {
                await SyncedTripApi.rejectInvitation(token);
            }
            setMessage(
                action === "accept"
                    ? "Invitation accepted. The trip is now in My Trips."
                    : "Invitation declined.",
            );
        } catch (reason) {
            setMessage(
                reason instanceof ApiError
                    ? reason.message
                    : "Unable to respond to this invitation.",
            );
        }
    }

    return (
        <Container>
            <Card>
                <Stack gap="md">
                    <Heading level={1}>Shared trip invitation</Heading>
                    <p>Log in with the invited email address to continue.</p>
                    {message && <p role="alert">{message}</p>}
                    <Button type="button" onClick={() => respond("accept")}>
                        Accept invitation
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => respond("reject")}
                    >
                        Decline invitation
                    </Button>
                </Stack>
            </Card>
        </Container>
    );
}
