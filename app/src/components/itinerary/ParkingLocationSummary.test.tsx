import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ParkingLocationSummary } from "./ParkingLocationSummary";

import type { ParkingLocation } from "../../types";

describe("ParkingLocationSummary", () => {
    it("renders the parking code, name, price and note", () => {
        const parking: ParkingLocation = {
            id: "p1",
            code: "P1",
            name: "Central Garage",
            price: "10 USD/day",
            note: "Covered parking",
        };

        const markup = renderToStaticMarkup(
            <ParkingLocationSummary parking={parking} />
        );

        expect(markup).toContain("P1");
        expect(markup).toContain("Central Garage");
        expect(markup).toContain("Price: 10 USD/day");
        expect(markup).toContain("Covered parking");
    });

    it("links the Smart Chip to the map link without replacing the location name", () => {
        const parking: ParkingLocation = {
            id: "p1",
            code: "P1",
            name: "Central Garage",
            smartChip: "Central Garage Entrance",
            mapLink: "https://maps.example.com/p1",
        };

        const markup = renderToStaticMarkup(
            <ParkingLocationSummary parking={parking} />
        );

        expect(markup).toContain('href="https://maps.example.com/p1"');
        expect(markup).toContain("Central Garage Entrance");
    });
});
