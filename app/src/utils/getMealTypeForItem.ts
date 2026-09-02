import type { ItineraryItem } from "../types";

export function getMealTypeForItem(
    item: ItineraryItem
): string | undefined {
    const title = item.title
        .trim()
        .toLocaleLowerCase()
        .replace(/^[^a-zá-ž]+/i, "");

    if (title.startsWith("snídaně")) {
        return "Breakfast";
    }

    if (title.startsWith("oběd")) {
        return "Lunch";
    }

    if (title.startsWith("večeře")) {
        return "Dinner";
    }

    if (title.startsWith("káva")) {
        return "CoffeeBreak";
    }

    if (title.startsWith("coffeebreak")) {
        return "CoffeeBreak";
    }

    return undefined;
}

export function matchesMealType(
    venueMealType: string | undefined,
    mealType: string
): boolean {
    return venueMealType
        ?.replace(/[^a-z]/gi, "")
        .toLocaleLowerCase() ===
        mealType.toLocaleLowerCase();
}
