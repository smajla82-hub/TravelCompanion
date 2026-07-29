import CurrentTripCard from "../components/cards/CurrentTripCard";

export default function DashboardPage() {
    return (
        <main
            style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "80px",
            }}
        >
            <CurrentTripCard />
        </main>
    );
}