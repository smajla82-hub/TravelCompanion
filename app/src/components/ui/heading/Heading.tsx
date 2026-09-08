import "./Heading.css";

import type { ReactNode } from "react";

type HeadingProps = {
    children: ReactNode;
    level?: 1 | 2 | 3;
    className?: string;
};

export function Heading({
    children,
    level = 1,
    className,
}: HeadingProps) {
    switch (level) {
        case 1:
            return <h1 className={className}>{children}</h1>;

        case 2:
            return <h2 className={className}>{children}</h2>;

        default:
            return <h3 className={className}>{children}</h3>;
    }
}