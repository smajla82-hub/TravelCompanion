import "./Container.css";

import type { ReactNode } from "react";

type ContainerProps = {
    children: ReactNode;
};

export function Container({
    children,
}: ContainerProps) {
    return (
        <div className="container">
            {children}
        </div>
    );
}