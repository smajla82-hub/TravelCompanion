const GOOGLE_MAPS_SEARCH_ORIGIN =
    "https://www.google.com/maps/search/?api=1&query=";

export function buildMapSearchQuery(
    title: string,
    location: string,
): string {
    const trimmedTitle = title.trim();
    const trimmedLocation = location.trim();

    if (trimmedTitle && trimmedLocation) {
        return `${trimmedTitle} ${trimmedLocation}`;
    }

    return trimmedLocation || trimmedTitle;
}

export function getMapSearchUrl(
    title: string,
    location: string,
): string | undefined {
    const query = buildMapSearchQuery(title, location);

    if (!query) {
        return undefined;
    }

    return `${GOOGLE_MAPS_SEARCH_ORIGIN}${encodeURIComponent(query)}`;
}
