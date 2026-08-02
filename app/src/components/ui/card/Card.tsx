import "./Card.css";

import type { ReactNode, HTMLAttributes } from "react";

type CardVariant =
    | "default"
    | "outlined";

type CardProps =
    HTMLAttributes<HTMLDivElement> & {
        children: ReactNode;
        variant?: CardVariant;
    };

export function Card({
    children,
    variant = "default",
    className = "",
    ...props
}: CardProps) {
    return (
        <div
            className={`tc-card tc-card--${variant} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}