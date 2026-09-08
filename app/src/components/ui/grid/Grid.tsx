import "./Grid.css";

import type { ReactNode } from "react";

type GridProps = {
    children: ReactNode;
    columns?: 1 | 2 | 3 | 4;
    className?: string;
};

export function Grid({
    children,
    columns = 2,
    className = "",
}: GridProps) {
    return (
        <div
            className={`tc-grid ${className}`}
            style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
        >
            {children}
        </div>
    );
}