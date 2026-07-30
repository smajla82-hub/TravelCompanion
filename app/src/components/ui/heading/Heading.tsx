import "./Heading.css";

import type { ReactNode } from "react";

type HeadingProps = {
    children: ReactNode;
    level?: 1 | 2 | 3;
};

export function Heading({
    children,
    level = 1,
}: HeadingProps) {
    switch (level) {
        case 1:
            return <h1>{children}</h1>;

        case 2:
            return <h2>{children}</h2>;

        default:
            return <h3>{children}</h3>;
    }
}