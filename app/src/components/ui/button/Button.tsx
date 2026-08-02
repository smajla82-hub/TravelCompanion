import "./Button.css";

import type { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant =
    | "primary"
    | "secondary";

type ButtonProps =
    ButtonHTMLAttributes<HTMLButtonElement> & {
        children: ReactNode;
        variant?: ButtonVariant;
    };

export function Button({
    children,
    variant = "primary",
    className = "",
    ...props
}: ButtonProps) {
    return (
        <button
            className={`tc-button tc-button--${variant} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}