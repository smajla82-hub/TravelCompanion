import { NavLink } from "react-router-dom";

import { Icon } from "../components/ui";

import "./MainLayout.css";

type MainLayoutProps = {
    children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <main className="tc-main">
            {children}
            <nav className="tc-bottom-nav">
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