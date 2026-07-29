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
        </main>
    );
}