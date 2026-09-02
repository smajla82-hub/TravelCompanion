import { Button } from "../ui";
import "./ActivityActionStack.css";

type ActivityActionStackProps = {
    showFood: boolean;
    showParking: boolean;
    onFood: () => void;
    onParking: () => void;
    onStatistics: () => void;
};

export function ActivityActionStack({
    showFood,
    showParking,
    onFood,
    onParking,
    onStatistics,
}: ActivityActionStackProps) {
    return (
        <div className="activity-action-stack">
            {showFood && (
                <Button
                    type="button"
                    compact
                    aria-label="Recommended food"
                    onClick={onFood}
                >
                    🍴
                </Button>
            )}
            {showParking && (
                <Button
                    type="button"
                    compact
                    aria-label="Parking"
                    onClick={onParking}
                >
                    P
                </Button>
            )}
            <Button
                type="button"
                compact
                aria-label="Statistics"
                onClick={onStatistics}
            >
                ◔
            </Button>
        </div>
    );
}
