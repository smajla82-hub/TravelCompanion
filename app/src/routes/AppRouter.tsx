import { Routes, Route } from "react-router-dom";

import DashboardPage from "../pages/DashboardPage";
import SettingsPage from "../pages/SettingsPage";
import MyTripsPage from "../pages/MyTripsPage";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/trips" element={<MyTripsPage />} />
        </Routes>
    );
}