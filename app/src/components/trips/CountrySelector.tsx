import { useMemo, useState } from "react";

import {
    getCountry,
    normalizeCountry,
    searchCountries,
} from "../../utils/country";

import "./CountrySelector.css";

type CountrySelectorProps = {
    value: string;
    onChange: (country: string) => void;
};

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const selected = getCountry(value);

    const matches = useMemo(() => {
        return searchCountries(query).slice(0, 10);
    }, [query]);

    function choose(country: string) {
        onChange(country);
        setOpen(false);
    }

    return (
        <div className="tc-country-selector">
            <input
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls="country-options"
                aria-autocomplete="list"
                value={open ? query : (selected ? `${selected.flag} ${selected.name}` : value)}
                placeholder="Search countries"
                onFocus={() => {
                    setQuery(selected ? selected.name : value);
                    setOpen(true);
                }}
                onChange={event => {
                    const next = event.target.value;
                    setQuery(next);
                    const normalized = normalizeCountry(next);
                    if (getCountry(normalized)) {
                        onChange(normalized);
                    }
                    if (!next) {
                        onChange("");
                    }
                    setOpen(true);
                }}
            />
            {open && (
                <ul id="country-options" role="listbox">
                    {matches.map(country => (
                        <li key={country.code}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={country.code === value}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => choose(country.code)}
                            >
                                {country.flag} {country.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
