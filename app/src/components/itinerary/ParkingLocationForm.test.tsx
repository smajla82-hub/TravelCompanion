import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ParkingLocationForm } from "./ParkingLocationForm";

describe("ParkingLocationForm", () => {
    it("uses the Smart Chip as the available Find on Map query field", () => {
        const markup = renderToStaticMarkup(
            <ParkingLocationForm
                existingCodes={[]}
                parking={{
                    id: "p4",
                    code: "P4",
                    name: "Manhattan Beach Pier Parking",
                    smartChip: "Manhattan Beach Pier",
                    mapLink: "https://maps.example.com/p4",
                }}
                onSubmit={() => {}}
            />,
        );

        expect(markup).toContain('value="Manhattan Beach Pier Parking"');
        expect(markup).toContain('value="Manhattan Beach Pier"');
        expect(markup).toContain("Find on Map");
        expect(markup).toContain('value="https://maps.example.com/p4"');
    });
});
