import "./Stack.css";

import type { ReactNode } from "react";

type StackProps = {
    children: ReactNode;
    gap?: "sm" | "md" | "lg";
};

export function Stack({
    children,
    gap = "md",
}: StackProps) {
    return (
        <div className={`stack stack-${gap}`}>
            {children}
        </div>
    );
}