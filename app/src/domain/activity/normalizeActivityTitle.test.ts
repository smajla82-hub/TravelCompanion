import { describe, expect, it } from "vitest";

import { normalizeActivityTitle } from "./normalizeActivityTitle";

describe("normalizeActivityTitle", () => {
    it.each([
        ["🍳 Snídaně", "Snídaně"],
        ["✈️ Odlet z Prahy", "Odlet z Prahy"],
        ["🚗 Převzetí auta", "Převzetí auta"],
    ])("removes the known legacy prefix from %s", (title, expected) => {
        expect(normalizeActivityTitle(title)).toBe(expected);
    });

    it("does not remove emojis outside a legacy prefix", () => {
        expect(normalizeActivityTitle("Večeře 🍺 a posezení")).toBe(
            "Večeře 🍺 a posezení"
        );
    });
});
