import { ApiError } from "../../api/client";

export function lockConflictMessage(error: ApiError) {
    const body = error.body as {
        lockedBy?: { email?: string; displayName?: string | null };
    } | undefined;
    const name = body?.lockedBy?.displayName || body?.lockedBy?.email;
    return name
        ? `This trip is currently being edited by ${name}. Please try again when they finish.`
        : "This trip was changed by someone else. Please reload and retry.";
}
