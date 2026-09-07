import { SyncedTripApi } from "../api/trips";
import { OnlineTripStore } from "../services/OnlineTripStore";

export type InvitationAction = "accept" | "reject";

/**
 * Responds to a pending invitation exactly once for the given action.
 * Acceptance additionally refreshes the online Trips cache so the newly
 * shared trip appears in My Trips without requiring an unrelated remount.
 */
export async function respondToInvitation(action: InvitationAction, token: string): Promise<void> {
    if (action === "accept") {
        await SyncedTripApi.acceptInvitation(token);
        await OnlineTripStore.refresh();
        return;
    }

    await SyncedTripApi.rejectInvitation(token);
}
