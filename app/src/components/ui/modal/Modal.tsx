import "./Modal.css";

import type { ReactNode } from "react";

type ModalProps = {
    open: boolean;
    children: ReactNode;
    onClose: () => void;
};

export function Modal({
    open,
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
                >
                    ×
                </button>

                {children}
            </div>
        </div>
    );
}