import "./Modal.css";

import {
    useEffect,
    type ReactNode,
} from "react";

import { Icon } from "../icon/Icon";
import { lockBodyScroll, unlockBodyScroll } from "./modalScrollLock";

type ModalProps = {
    open: boolean;
    title?: string;
    ariaLabel?: string;
    children: ReactNode;
    onClose: () => void;
};

export function Modal({
    open,
    title,
    ariaLabel,
    children,
    onClose,
}: ModalProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        lockBodyScroll();

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
            unlockBodyScroll();

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
                aria-label={title ? undefined : ariaLabel}
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
                    <Icon name="x" width={20} height={20} />
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