import { describe, expect, it } from "vitest";
import { lockBodyScroll, unlockBodyScroll } from "./modalScrollLock";

function createBody() {
    return {
        style: { overflow: "" },
        dataset: {} as Record<string, string | undefined>,
    } as unknown as HTMLElement;
}

describe("Modal body scroll lock", () => {
    it("keeps body locked when closing a child modal while parent modal is still open", () => {
        const body = createBody();

        expect(lockBodyScroll(body)).toBe(1);
        expect(lockBodyScroll(body)).toBe(2);
        expect(body.style.overflow).toBe("hidden");

        expect(unlockBodyScroll(body)).toBe(1);
        expect(body.style.overflow).toBe("hidden");
        expect(body.dataset.tcModalLockCount).toBe("1");
    });

    it("restores body scrolling only after the final modal closes", () => {
        const body = createBody();

        lockBodyScroll(body);
        lockBodyScroll(body);

        expect(unlockBodyScroll(body)).toBe(1);
        expect(body.style.overflow).toBe("hidden");

        expect(unlockBodyScroll(body)).toBe(0);
        expect(body.style.overflow).toBe("");
        expect(body.dataset.tcModalLockCount).toBeUndefined();
    });
});
