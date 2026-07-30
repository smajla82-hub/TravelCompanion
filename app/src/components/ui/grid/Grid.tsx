import "./Grid.css";

import type { ReactNode } from "react";

type GridProps = {
    children: ReactNode;
};

export function Grid({ children }: GridProps) {
    return (
        <div className="grid">
            {children}
        </div>
    );
}