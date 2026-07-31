import "./Grid.css";

import type { ReactNode } from "react";

type GridProps = {
    children: ReactNode;
    columns?: 1 | 2 | 3 | 4;
};

export function Grid({
    children,
    columns = 2,
}: GridProps) {
    return (
        <div
            className="tc-grid"
            style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
        >
            {children}
        </div>
    );
}