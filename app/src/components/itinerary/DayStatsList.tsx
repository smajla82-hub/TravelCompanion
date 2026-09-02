import { Stack } from "../ui";

import type { DayStat } from "../../types";

type DayStatsListProps = {
    stats: DayStat[];
};

export function DayStatsList({
    stats,
}: DayStatsListProps) {
    if (stats.length === 0) {
        return (
            <p>
                No statistics for this day.
            </p>
        );
    }

    return (
        <Stack gap="sm">
            {stats.map((stat) => (
                <div key={stat.label}>
                    <strong>
                        {stat.label}:
                    </strong>
                    {" "}
                    {stat.value}
                </div>
            ))}
        </Stack>
    );
}
