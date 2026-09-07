export function scrollToItinerary(document: Pick<Document, "getElementById">): boolean {
    const itinerary = document.getElementById("itinerary-section");
    if (!itinerary) {
        return false;
    }

    itinerary.scrollIntoView({ behavior: "smooth" });
    return true;
}
