const GOOGLE_MAPS_SEARCH_ORIGIN =
    "https://www.google.com/maps/search/?api=1&query=";

export function buildMapSearchQuery(
    smartChip: string,
): string {
    return smartChip.trim();
}

export function getMapSearchUrl(
    smartChip: string,
): string | undefined {
    const query = buildMapSearchQuery(smartChip);

    if (!query) {
        return undefined;
    }

    return `${GOOGLE_MAPS_SEARCH_ORIGIN}${encodeURIComponent(query)}`;
}

export function openMapSearch(
    smartChip: string,
    openWindow: (
        url: string,
        target: string,
        features: string,
    ) => void = (url, target, features) => {
        window.open(url, target, features);
    },
): boolean {
    const url = getMapSearchUrl(smartChip);

    if (!url) {
        return false;
    }

    openWindow(url, "_blank", "noopener,noreferrer");

    return true;
}
