import { useState } from "react";

import { ApiError } from "../api/client";
import { AuthService } from "../services/AuthService";
import { Button, Card, Container, Heading, Stack } from "../components/ui";

export default function AccountPage() {
    const [user, setUser] = useState(AuthService.getUser());
    const [registering, setRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function submit() {
        setError("");
        try {
            const authenticatedUser = registering
                ? await AuthService.register(email, password)
                : await AuthService.login(email, password);
            setUser(authenticatedUser);
            setPassword("");
        } catch (reason) {
            setError(
                reason instanceof ApiError
                    ? reason.message
                    : "Unable to sign in.",
            );
        }
    }

    function logout() {
        AuthService.logout();
        setUser(undefined);
    }

    return (
        <Container>
            <Stack gap="lg">
                <Heading level={1}>Account & Sync</Heading>
                <Card>
                    <Stack gap="md">
                        {user ? (
                            <>
                                <p>
                                    Signed in as <strong>{user.email}</strong>.
                                    Synced and shared trips are available in My Trips.
                                </p>
                                <Button type="button" onClick={logout}>
                                    Log out
                                </Button>
                            </>
                        ) : (
                            <>
                                <p>
                                    Sign in to view synced and shared trips. Local
                                    trips always remain available without an account.
                                </p>
                                <label>
                                    Email
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={event => setEmail(event.target.value)}
                                    />
                                </label>
                                <label>
                                    Password
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={event => setPassword(event.target.value)}
                                    />
                                </label>
                                {error && <p role="alert">{error}</p>}
                                <Button type="button" onClick={submit}>
                                    {registering ? "Create account" : "Log in"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRegistering(value => !value)}
                                >
                                    {registering
                                        ? "I already have an account"
                                        : "Create an account"}
                                </Button>
                            </>
                        )}
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );
}
