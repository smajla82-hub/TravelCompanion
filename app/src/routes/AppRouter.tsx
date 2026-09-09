import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";

import DashboardPage from "../pages/DashboardPage";
import SettingsPage from "../pages/SettingsPage";
import MyTripsPage from "../pages/MyTripsPage";
import AccountPage from "../pages/AccountPage";
import AcceptInvitationPage from "../pages/AcceptInvitationPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import { ACCEPT_INVITE_PATH_PREFIX } from "../utils/invitationLink";

function DashboardRoute() {
    const [searchParams] = useSearchParams();
    const invitationToken = searchParams.get("invite");

    if (invitationToken) {
        return <Navigate to={`${ACCEPT_INVITE_PATH_PREFIX}${invitationToken}`} replace />;
    }

    return <DashboardPage />;
}

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<DashboardRoute />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/trips" element={<MyTripsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path={`${ACCEPT_INVITE_PATH_PREFIX}:token`} element={<AcceptInvitationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}