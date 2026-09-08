import { useId, useState } from "react";
import type { CSSProperties } from "react";

import { ApiError } from "../api/client";
import { AuthService } from "../services/AuthService";
import { TripService } from "../services/TripService";
import { OnlineTripStore } from "../services/OnlineTripStore";
import { SETTINGS_BACKGROUND_URL } from "../styles/brandAssets";
import { Button, Card, Container, Heading, Icon, Stack } from "../components/ui";
import "./AccountPage.css";

// The Account page reuses the approved Settings artwork — no new asset.
const pageStyle = {
    "--tc-settings-artwork": `url("${SETTINGS_BACKGROUND_URL}")`,
} as CSSProperties;

const GENERIC_FORGOT_PASSWORD_MESSAGE =
    "If an account exists for that email address, a password reset link has been sent.";

type Mode = "login" | "register" | "forgot-password";

export default function AccountPage() {
    const [user, setUser] = useState(AuthService.getUser());
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

    const [displayName, setDisplayName] = useState(user?.displayName ?? "");
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    const emailFieldId = useId();
    const passwordFieldId = useId();
    const displayNameFieldId = useId();

    const localTripCount = TripService.getAll().length;

    async function submit() {
        setError("");
        setSubmitting(true);
        try {
            const authenticatedUser = mode === "register"
                ? await AuthService.register(email, password)
                : await AuthService.login(email, password);
            setUser(authenticatedUser);
            setDisplayName(authenticatedUser.displayName ?? "");
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

    async function submitForgotPassword() {
        setError("");
        setForgotPasswordMessage("");
        setSubmitting(true);
        try {
            const response = await AuthService.requestPasswordReset(email);
            setForgotPasswordMessage(response.message);
        } catch (reason) {
            // The API always answers generically on success; a thrown error here
            // means the request itself failed (network/rate limit), not that the
            // email doesn't exist.
            setError(
                reason instanceof ApiError
                    ? reason.message
                    : GENERIC_FORGOT_PASSWORD_MESSAGE,
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setProfileError("");
        setProfileMessage("");
        setSavingProfile(true);
        try {
            const updated = await AuthService.updateProfile(displayName);
            setUser(updated);
            setDisplayName(updated.displayName ?? "");
            setProfileMessage("Display name saved.");
        } catch (reason) {
            setProfileError(
                reason instanceof ApiError
                    ? reason.message
                    : "Unable to save your display name.",
            );
        } finally {
            setSavingProfile(false);
        }
    }

    function logout() {
        AuthService.logout();
        setUser(undefined);
        setDisplayName("");
        // The cached Online Trips belong to the signed-out account; clearing
        // them keeps My Trips consistent with the now-unauthenticated state.
        void OnlineTripStore.refresh().catch(() => undefined);
    }

    return (
        <Container>
            <section className="settings-page" style={pageStyle}>
            <Stack gap="lg">
                <Heading level={1} className="tc-hero-title">Account &amp; Sync</Heading>

                <Card>
                    <Stack gap="md">
                        <Heading level={2}>Account</Heading>

                        {user ? (
                            <>
                                <p className="account-status account-status--signed-in">
                                    <Icon name="circleCheck" width={16} height={16} />
                                    Signed in as <strong>{user.displayName || user.email}</strong>
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
                        ) : mode === "forgot-password" ? (
                            <>
                                <p>
                                    Enter your account email and we&rsquo;ll send a link to
                                    reset your password.
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

                                    {forgotPasswordMessage && (
                                        <p className="account-status account-status--signed-in" role="status">
                                            <Icon name="circleCheck" width={16} height={16} />
                                            {forgotPasswordMessage}
                                        </p>
                                    )}
                                    {error && (
                                        <p className="account-status account-status--error" role="alert">
                                            <Icon name="circleAlert" width={16} height={16} />
                                            {error}
                                        </p>
                                    )}

                                    <Button
                                        type="button"
                                        onClick={submitForgotPassword}
                                        disabled={submitting}
                                    >
                                        {submitting ? "Please wait…" : "Send reset link"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setMode("login");
                                            setError("");
                                            setForgotPasswordMessage("");
                                        }}
                                        disabled={submitting}
                                    >
                                        Back to log in
                                    </Button>
                                </Stack>
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
                                                mode === "register" ? "new-password" : "current-password"
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
                                            : mode === "register"
                                                ? "Create account"
                                                : "Log in"}
                                    </Button>
                                    {mode === "login" && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setMode("forgot-password");
                                                setError("");
                                            }}
                                            disabled={submitting}
                                        >
                                            Forgot password?
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setMode(current => current === "register" ? "login" : "register");
                                            setError("");
                                        }}
                                        disabled={submitting}
                                    >
                                        {mode === "register"
                                            ? "I already have an account"
                                            : "Create an account"}
                                    </Button>
                                </Stack>
                            </>
                        )}
                    </Stack>
                </Card>

                {user && (
                    <Card>
                        <Stack gap="md">
                            <Heading level={2}>Profile</Heading>
                            <p>
                                Your display name is shown to collaborators on shared
                                Trips instead of your email address.
                            </p>

                            <form onSubmit={saveProfile}>
                                <Stack gap="sm" className="account-form">
                                    <label htmlFor={displayNameFieldId}>
                                        Display name
                                        <input
                                            id={displayNameFieldId}
                                            type="text"
                                            autoComplete="name"
                                            maxLength={80}
                                            placeholder={user.email}
                                            value={displayName}
                                            onChange={event => setDisplayName(event.target.value)}
                                        />
                                    </label>

                                    {profileMessage && (
                                        <p className="account-status account-status--signed-in" role="status">
                                            <Icon name="circleCheck" width={16} height={16} />
                                            {profileMessage}
                                        </p>
                                    )}
                                    {profileError && (
                                        <p className="account-status account-status--error" role="alert">
                                            <Icon name="circleAlert" width={16} height={16} />
                                            {profileError}
                                        </p>
                                    )}

                                    <Button type="submit" disabled={savingProfile}>
                                        {savingProfile ? "Saving…" : "Save display name"}
                                    </Button>
                                </Stack>
                            </form>
                        </Stack>
                    </Card>
                )}

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
            </section>
        </Container>
    );
}
