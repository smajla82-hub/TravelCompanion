import { Link } from "react-router-dom";

type MainLayoutProps = {
    children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <main
            style={{
                padding: "32px",
                minHeight: "100vh",
            }}
        >
            {children}

            <nav
                style={{
                    padding: "0 32px 32px",
                    textAlign: "center",
                }}
            >
                <Link to="/settings">
                    Settings
                </Link>
            </nav>
        </main>
    );
}