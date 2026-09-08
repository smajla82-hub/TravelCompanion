import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ParkingLocationActionsModal } from "./ParkingLocationActionsModal";

import type { ItineraryItem, ParkingLocation } from "../../types";

function baseItem(overrides: Partial<ItineraryItem> = {}): ItineraryItem {
    return {
        id: "item-1",
        time: "",
        title: "Mulholland Drive",
        location: "",
        activityType: "",
        priority: "",
        parking: "P1",
        smartChip: "",
        mapLink: "",
        price: "",
        note: "",
        date: "2026-09-11",
        ...overrides,
    };
}

const parking: ParkingLocation = {
    id: "p1",
    code: "P1",
    name: "Mulholland Scenic Overlook",
};

describe("ParkingLocationActionsModal", () => {
    it("shows Edit/Delete controls with no warning when not referenced", () => {
        const markup = renderToStaticMarkup(
            <ParkingLocationActionsModal
                open
                parking={parking}
                referencingItems={[]}
                onClose={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
            />
        );

        expect(markup).toContain("Delete");
        expect(markup).not.toContain("parking-actions-warning");
    });

    it("renders a prominent green heading, listed activities and a light-blue note when referenced", () => {
        const referencingItems = [
            baseItem({ id: "item-1", title: "Mulholland Drive" }),
            baseItem({ id: "item-2", title: "Hollywood Bowl Overlook" }),
        ];

        const markup = renderToStaticMarkup(
            <ParkingLocationActionsModal
                open
                parking={parking}
                referencingItems={referencingItems}
                onClose={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
            />
        );

        expect(markup).toContain("parking-actions-warning__heading");
        expect(markup).toContain("2 Activities reference P1:");
        expect(markup).toContain("parking-actions-warning__list");
        expect(markup).toContain("Mulholland Drive,");
        expect(markup).toContain("Hollywood Bowl Overlook,");
        expect(markup).toContain("parking-actions-warning__note");
        expect(markup).toContain(
            "Remove or reassign them before deleting this parking location."
        );

        // No "delete and clear references" escape hatch, and no raw Delete
        // control while the parking location is still referenced.
        expect(markup).not.toContain("clear references");
        expect(markup.match(/>Delete</g) ?? []).toHaveLength(0);
    });

    it("uses singular wording for a single referencing activity", () => {
        const markup = renderToStaticMarkup(
            <ParkingLocationActionsModal
                open
                parking={parking}
                referencingItems={[baseItem()]}
                onClose={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
            />
        );

        expect(markup).toContain("1 Activity references P1:");
    });
});
