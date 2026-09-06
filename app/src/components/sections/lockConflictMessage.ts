import { ApiError } from "../../api/client";

export function lockConflictMessage(error: ApiError) {
    const body = error.body as {
        lockedBy?: { email?: string };
    } | undefined;
    const email = body?.lockedBy?.email;
    return email
        ? `This trip is currently being edited by ${email}. Please try again when they finish.`
        : "This trip was changed by someone else. Please reload and retry.";
}
