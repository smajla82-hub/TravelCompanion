import type { ParkingLocation } from "../../types";

type ParkingLocationSummaryProps = {
    parking: ParkingLocation;
};

/** Read-only content for a single Parking Location entry. */
export function ParkingLocationSummary({
    parking,
}: ParkingLocationSummaryProps) {
    return (
        <div className="parking-location-summary">
            <strong>
                {parking.code}:
            </strong>
            {" "}
            {parking.name}

            {parking.smartChip && (
                <div>
                    {parking.mapLink ? (
                        <a
                            href={parking.mapLink}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {parking.smartChip}
                        </a>
                    ) : (
                        parking.smartChip
                    )}
                </div>
            )}

            {parking.price && (
                <div>
                    Price: {parking.price}
                </div>
            )}

            {parking.note && (
                <div>
                    {parking.note}
                </div>
            )}
        </div>
    );
}
