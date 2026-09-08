import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ParkingLocationManageRow } from "./ParkingLocationManageRow";

import type { ParkingLocation } from "../../types";

const parking: ParkingLocation = {
    id: "p1",
    code: "P1",
    name: "Central Garage",
};

describe("ParkingLocationManageRow", () => {
    it("places the Manage button after the parking content, inside the same content column", () => {
        const markup = renderToStaticMarkup(
            <ParkingLocationManageRow
                parking={parking}
                editable
                onManage={() => {}}
            />
        );

        const contentStart = markup.indexOf("itinerary-activity-content");
        const nameIndex = markup.indexOf("Central Garage");
        const manageIndex = markup.indexOf(">Manage<");
        const separatorIndex = markup.indexOf(
            "itinerary-activity-separator"
        );

        expect(contentStart).toBeGreaterThan(-1);
        expect(nameIndex).toBeGreaterThan(contentStart);
        expect(manageIndex).toBeGreaterThan(nameIndex);
        expect(manageIndex).toBeLessThan(separatorIndex);
    });

    it("renders the shared itinerary separator after the complete parking + Manage block", () => {
        const markup = renderToStaticMarkup(
            <ParkingLocationManageRow
                parking={parking}
                editable
                onManage={() => {}}
            />
        );

        expect(markup).toContain("itinerary-activity-row");
        expect(markup).toContain("itinerary-activity-separator");
    });

    it("hides the Manage button when not editable", () => {
        const markup = renderToStaticMarkup(
            <ParkingLocationManageRow parking={parking} editable={false} />
        );

        expect(markup).not.toContain("Manage");
    });
});
