import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";

import DashboardPage from "../pages/DashboardPage";
import SettingsPage from "../pages/SettingsPage";
import MyTripsPage from "../pages/MyTripsPage";
import AccountPage from "../pages/AccountPage";
import AcceptInvitationPage from "../pages/AcceptInvitationPage";

function DashboardRoute() {
    const [searchParams] = useSearchParams();
    const invitationToken = searchParams.get("invite");

    if (invitationToken) {
        return <Navigate to={`/accept-invite/${invitationToken}`} replace />;
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
            <Route path="/accept-invite/:token" element={<AcceptInvitationPage />} />
        </Routes>
    );
}