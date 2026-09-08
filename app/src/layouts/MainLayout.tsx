import type { CSSProperties } from "react";

import { NavLink } from "react-router-dom";

import { Icon } from "../components/ui";

import { BOTTOM_NAV_BACKGROUND_URL } from "../styles/brandAssets";

import "./MainLayout.css";

const bottomNavStyle = {
    "--tc-bottom-nav-artwork": `url("${BOTTOM_NAV_BACKGROUND_URL}")`,
} as CSSProperties;

type MainLayoutProps = {
    children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <main className="tc-main">
            {children}
            <nav className="tc-bottom-nav" style={bottomNavStyle}>
                <NavLink to="/" end>
                    <Icon name="home" />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/trips">
                    <Icon name="briefcase" />
                    <span>My Trips</span>
                </NavLink>
                <NavLink to="/settings">
                    <Icon name="settings" />
                    <span>Settings</span>
                </NavLink>
            </nav>
        </main>
    );
}