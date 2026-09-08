import { useId, useState } from "react";

import { Link, useParams } from "react-router-dom";

import { ApiError } from "../api/client";
import { AuthService } from "../services/AuthService";
import { Button, Card, Container, Heading, Icon, Stack } from "../components/ui";
import "./AccountPage.css";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
    const { token } = useParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const passwordFieldId = useId();
    const confirmFieldId = useId();

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!token) {
            setError("This reset link is missing its token.");
            return;
        }

        setSubmitting(true);
        try {
            await AuthService.resetPassword(token, password);
            setDone(true);
        } catch (reason) {
            setError(
                reason instanceof ApiError
                    ? reason.message
                    : "Unable to reset your password.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Container>
            <Card>
                <Stack gap="md">
                    <Heading level={1}>Reset your password</Heading>

                    {done ? (
                        <>
                            <p className="account-status account-status--signed-in">
                                <Icon name="circleCheck" width={16} height={16} />
                                Your password has been updated.
                            </p>
                            <p>
                                <Link to="/account">Go to Account to log in</Link>
                            </p>
                        </>
                    ) : (
                        <form onSubmit={submit}>
                            <Stack gap="sm" className="account-form">
                                <label htmlFor={passwordFieldId}>
                                    New password
                                    <input
                                        id={passwordFieldId}
                                        type="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={event => setPassword(event.target.value)}
                                    />
                                </label>
                                <label htmlFor={confirmFieldId}>
                                    Confirm new password
                                    <input
                                        id={confirmFieldId}
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={event => setConfirmPassword(event.target.value)}
                                    />
                                </label>

                                {error && (
                                    <p className="account-status account-status--error" role="alert">
                                        <Icon name="circleAlert" width={16} height={16} />
                                        {error}
                                    </p>
                                )}

                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Please wait…" : "Reset password"}
                                </Button>
                            </Stack>
                        </form>
                    )}
                </Stack>
            </Card>
        </Container>
    );
}
