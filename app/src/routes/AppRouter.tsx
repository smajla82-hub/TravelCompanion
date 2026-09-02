import { Routes, Route } from "react-router-dom";

import DashboardPage from "../pages/DashboardPage";
import SettingsPage from "../pages/SettingsPage";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
        </Routes>
    );
}