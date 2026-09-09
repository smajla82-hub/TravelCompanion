import { describe, expect, it } from "vitest";
import { resolveBrandAssetUrl } from "./brandAssets";

describe("resolveBrandAssetUrl", () => {
    it("resolves settings artwork under the GitHub Pages base path", () => {
        expect(resolveBrandAssetUrl("/TravelCompanion/", "settings_background1440x3200.webp"))
            .toBe("/TravelCompanion/assets/settings_background1440x3200.webp");
    });

    it("normalizes bases without a trailing slash", () => {
        expect(resolveBrandAssetUrl("/TravelCompanion", "settings_background1440x3200.webp"))
            .toBe("/TravelCompanion/assets/settings_background1440x3200.webp");
    });
});
