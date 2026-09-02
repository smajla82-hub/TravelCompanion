import { NavLink } from "react-router-dom";
import { Home, Settings } from "../components/ui/icon";
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
                    <Home /> <span>Home</span>
                </NavLink>
                <NavLink to="/settings">
                    <Settings /> <span>Settings</span>
                </NavLink>
            </nav>
        </main>
    );
}