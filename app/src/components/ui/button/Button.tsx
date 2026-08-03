import "./Button.css";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = {
    children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className="tc-button"
            {...props}
        >
            {children}
        </button>
    );
}