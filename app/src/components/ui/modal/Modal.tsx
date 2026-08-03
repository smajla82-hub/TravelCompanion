import "./Modal.css";

import type { ReactNode } from "react";

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
            >
                <button
                    className="tc-modal-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>

                {title && (
                    <h2 className="tc-modal-title">
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