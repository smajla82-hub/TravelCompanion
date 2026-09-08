import { useId, useState } from "react";

import { ApiError } from "../api/client";
import { AuthService } from "../services/AuthService";
import { TripService } from "../services/TripService";
import { OnlineTripStore } from "../services/OnlineTripStore";
import { Button, Card, Container, Heading, Icon, Stack } from "../components/ui";
import "./AccountPage.css";

export default function AccountPage() {
    const [user, setUser] = useState(AuthService.getUser());
    const [registering, setRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const emailFieldId = useId();
    const passwordFieldId = useId();

    const localTripCount = TripService.getAll().length;

    async function submit() {
        setError("");
        setSubmitting(true);
        try {
            const authenticatedUser = registering
                ? await AuthService.register(email, password)
                : await AuthService.login(email, password);
            setUser(authenticatedUser);
            setPassword("");
            void OnlineTripStore.refresh().catch(() => undefined);
        } catch (reason) {
            setError(
                reason instanceof ApiError
                    ? reason.message
                    : "Unable to sign in.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    function logout() {
        AuthService.logout();
        setUser(undefined);
        // The cached Online Trips belong to the signed-out account; clearing
        // them keeps My Trips consistent with the now-unauthenticated state.
        void OnlineTripStore.refresh().catch(() => undefined);
    }

    return (
        <Container>
            <Stack gap="lg">
                <Heading level={1}>Account & Sync</Heading>

                <Card>
                    <Stack gap="md">
                        <Heading level={2}>Account</Heading>

                        {user ? (
                            <>
                                <p className="account-status account-status--signed-in">
                                    <Icon name="circleCheck" width={16} height={16} />
                                    Signed in as <strong>{user.email}</strong>
                                </p>
                                <p>
                                    Synced and shared Trips are available in My Trips on
                                    any device you sign in to.
                                </p>
                                <Button type="button" onClick={logout}>
                                    <Icon name="logOut" width={16} height={16} />
                                    Log out
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className="account-status account-status--signed-out">
                                    <Icon name="circleAlert" width={16} height={16} />
                                    Not signed in
                                </p>
                                <p>
                                    Sign in to view synced and shared Trips. Local Trips
                                    always remain available on this device without an
                                    account.
                                </p>

                                <Stack gap="sm" className="account-form">
                                    <label htmlFor={emailFieldId}>
                                        Email
                                        <input
                                            id={emailFieldId}
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={event => setEmail(event.target.value)}
                                        />
                                    </label>
                                    <label htmlFor={passwordFieldId}>
                                        Password
                                        <input
                                            id={passwordFieldId}
                                            type="password"
                                            autoComplete={
                                                registering ? "new-password" : "current-password"
                                            }
                                            value={password}
                                            onChange={event => setPassword(event.target.value)}
                                        />
                                    </label>

                                    {error && (
                                        <p className="account-status account-status--error" role="alert">
                                            <Icon name="circleAlert" width={16} height={16} />
                                            {error}
                                        </p>
                                    )}

                                    <Button type="button" onClick={submit} disabled={submitting}>
                                        {submitting
                                            ? "Please wait…"
                                            : registering
                                                ? "Create account"
                                                : "Log in"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setRegistering(value => !value)}
                                        disabled={submitting}
                                    >
                                        {registering
                                            ? "I already have an account"
                                            : "Create an account"}
                                    </Button>
                                </Stack>
                            </>
                        )}
                    </Stack>
                </Card>

                <Card>
                    <Stack gap="md">
                        <Heading level={2}>This device</Heading>

                        <p>
                            Local Trips are stored only in this browser and are not
                            affected by signing in or out.
                        </p>

                        <p>
                            <strong>{localTripCount}</strong>{" "}
                            {localTripCount === 1 ? "local Trip" : "local Trips"} on this
                            device.
                        </p>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );
}
