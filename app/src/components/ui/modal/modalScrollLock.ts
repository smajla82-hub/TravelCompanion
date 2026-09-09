const LOCK_COUNT_DATASET_KEY = "tcModalLockCount";

function readLockCount(body: HTMLElement) {
    const raw = body.dataset[LOCK_COUNT_DATASET_KEY];
    if (!raw) return 0;
    const count = Number(raw);
    return Number.isFinite(count) && count > 0 ? count : 0;
}

export function lockBodyScroll(body: HTMLElement = document.body) {
    const next = readLockCount(body) + 1;
    body.dataset[LOCK_COUNT_DATASET_KEY] = String(next);
    body.style.overflow = "hidden";
    return next;
}

export function unlockBodyScroll(body: HTMLElement = document.body) {
    const current = readLockCount(body);
    if (current <= 1) {
        delete body.dataset[LOCK_COUNT_DATASET_KEY];
        body.style.overflow = "";
        return 0;
    }

    const next = current - 1;
    body.dataset[LOCK_COUNT_DATASET_KEY] = String(next);
    body.style.overflow = "hidden";
    return next;
}
