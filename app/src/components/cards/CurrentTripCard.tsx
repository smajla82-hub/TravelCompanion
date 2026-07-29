import "./CurrentTripCard.css";

export default function CurrentTripCard() {
    return (
        <section className="trip-card">

            <div className="trip-header">

                <h2>🇮🇹 Lago di Garda</h2>

                <span className="trip-status">
                    Active Trip
                </span>

            </div>

            <div className="trip-body">

                <p>
                    Italy
                </p>

                <p>
                    15 Jul 2027 — 20 Jul 2027
                </p>

            </div>

            <div className="trip-progress">

                <div className="progress-bar">

                    <div
                        className="progress-fill"
                        style={{ width: "35%" }}
                    />

                </div>

                <span>35 % completed</span>

            </div>

            <button>

                Continue Trip

            </button>

        </section>
    );
}