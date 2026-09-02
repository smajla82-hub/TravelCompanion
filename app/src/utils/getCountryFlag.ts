const FLAGS: Record<string, string> = {
    usa: "🇺🇸",
    "united states": "🇺🇸",
    italy: "🇮🇹",
    italia: "🇮🇹",
    france: "🇫🇷",
    germany: "🇩🇪",
    canada: "🇨🇦",
    spain: "🇪🇸",
    uk: "🇬🇧",
    "united kingdom": "🇬🇧",
};

export function getCountryFlag(country: string): string {
    const value = country.toLowerCase();
    const match = Object.keys(FLAGS).find(key => value.includes(key));
    return match ? FLAGS[match] : "🌍";
}
