import "./Button.css";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = {
    children: ReactNode;
    variant?: "default" | "pill" | "success" | "outline";
    compact?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
    children,
    variant = "default",
    compact = false,
    className = "",
    ...props
}: ButtonProps) {
    return (
        <button
            className={`tc-button tc-button--${variant}${compact ? " tc-button--compact" : ""} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}