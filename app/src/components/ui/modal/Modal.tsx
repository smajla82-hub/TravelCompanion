import "./Modal.css";

import {
    useEffect,
    type ReactNode,
} from "react";

type ModalProps = {
    open: boolean;
    title?: string;
    children: ReactNode;
    onClose: () => void;
};

export function Modal({
    open,
    title,
    children,
    onClose,
}: ModalProps) {
    useEffect(() => {
        if (!open) {
            document.body.style.overflow = "";

            return;
        }

        document.body.style.overflow = "hidden";

        const listener = (
            event: KeyboardEvent,
        ) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            listener,
        );

        return () => {
            document.body.style.overflow = "";

            window.removeEventListener(
                "keydown",
                listener,
            );
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="tc-modal-overlay"
            onClick={onClose}
        >
            <div
                className="tc-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={
                    title
                        ? "tc-modal-title"
                        : undefined
                }
            >
                <button
                    className="tc-modal-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>

                {title && (
                    <h2
                        id="tc-modal-title"
                        className="tc-modal-title"
                    >
                        {title}
                    </h2>
                )}

                <div className="tc-modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
}