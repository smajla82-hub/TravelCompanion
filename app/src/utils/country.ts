export type Country = {
    code: string;
    name: string;
    flag: string;
};

// ISO 3166-1 alpha-2 codes supported by the country selector.
const ISO_CODES = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(" ");

const LEGACY_ALIASES: Record<string, string> = {
    "united states": "US",
    usa: "US",
    "united states of america": "US",
    "czech republic": "CZ",
    czechia: "CZ",
    "united kingdom": "GB",
    uk: "GB",
    "great britain": "GB",
    italia: "IT",
};

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const countries = ISO_CODES.map(code => ({
    code,
    name: displayNames.of(code) ?? code,
    flag: String.fromCodePoint(...[...code].map(letter => 0x1F1A5 + letter.charCodeAt(0))),
})).sort((left, right) => left.name.localeCompare(right.name));
const byCode = new Map(countries.map(country => [country.code, country]));
const nameToCode = new Map(countries.map(country => [country.name.toLowerCase(), country.code]));

export function listCountries(): Country[] {
    return countries;
}

export function searchCountries(query: string): Country[] {
    const term = query.replace(/^[^\w]*/u, "").toLowerCase();
    return countries.filter(country =>
        country.name.toLowerCase().includes(term)
        || country.code.toLowerCase().includes(term),
    );
}

export function normalizeCountry(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return "";
    }

    const upper = trimmed.toUpperCase();
    if (byCode.has(upper)) {
        return upper;
    }

    return LEGACY_ALIASES[trimmed.toLowerCase()]
        ?? nameToCode.get(trimmed.toLowerCase())
        ?? trimmed;
}

export function isCountryCode(value: string): boolean {
    return byCode.has(value);
}

export function getCountry(code: string): Country | undefined {
    return byCode.get(normalizeCountry(code));
}

export function getCountryFlag(country: string): string {
    return getCountry(country)?.flag ?? "🌍";
}

export function getCountryDisplayName(country: string): string {
    return getCountry(country)?.name ?? country;
}
