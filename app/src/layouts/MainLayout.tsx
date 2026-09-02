import { NavLink } from "react-router-dom";
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
                    <span>🏠 Home</span>
                </NavLink>
                <NavLink to="/trips">
                    <span>🧳 My Trips</span>
                </NavLink>
                <NavLink to="/settings">
                    <span>⚙️ Settings</span>
                </NavLink>
            </nav>
        </main>
    );
}