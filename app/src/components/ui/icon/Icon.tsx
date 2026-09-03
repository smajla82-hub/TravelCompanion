import type { ReactNode, SVGProps } from "react";

export type IconName =
    | "home"
    | "settings"
    | "briefcase"
    | "plus"
    | "calendarDays"
    | "usersRound"
    | "circleCheck"
    | "mapPin"
    | "target"
    | "zap"
    | "plane"
    | "dollarSign"
    | "notebookPen"
    | "chevron"
    | "chevronLeft"
    | "chevronRight"
    | "chevronDown"
    | "chevronUp"
    | "moreHorizontal"
    | "x"
    | "pencil"
    | "trash"
    | "star"
    | "barChart"
    | "squareParking"
    | "utensils"
    | "car"
    | "mountainSnow"
    | "trees"
    | "footprints"
    | "landmark"
    | "shoppingBag"
    | "bedDouble"
    | "key"
    | "luggage"
    | "idCard"
    | "moon"
    | "circleEllipsis";

const icons: Record<IconName, ReactNode> = {
    home: <path d="M3 10.5 12 3l9 7.5M5 9v11h14V9M9 20v-6h6v6" />,
    settings: (
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12a7 7 0 0 0-.2-1.6l2-1.2-2-3.4-2.1 1.2a8 8 0 0 0-2.8-1.6V3h-4v2.4a8 8 0 0 0-2.8 1.6L5 5.8 3 9.2l2 1.2A7 7 0 0 0 5 12c0 .6.1 1.1.2 1.6l-2 1.2 2 3.4 2.1-1.2a8 8 0 0 0 2.8 1.6V21h4v-2.4a8 8 0 0 0 2.8-1.6l2.1 1.2 2-3.4-2-1.2c.1-.5.2-1 .2-1.6Z" />
    ),
    briefcase: (
        <>
            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            <rect width="20" height="14" x="2" y="6" rx="2" />
        </>
    ),
    plus: (
        <>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </>
    ),
    calendarDays: (
        <>
            <path d="M8 2v3" />
            <path d="M16 2v3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M8 13h.01" />
            <path d="M12 13h.01" />
            <path d="M16 13h.01" />
            <path d="M8 17h.01" />
            <path d="M12 17h.01" />
            <path d="M16 17h.01" />
        </>
    ),
    usersRound: (
        <>
            <path d="M18 21a8 8 0 0 0-16 0" />
            <circle cx="10" cy="8" r="5" />
            <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
        </>
    ),
    circleCheck: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="m16 9-5.5 5.5L8 12" />
        </>
    ),
    mapPin: (
        <>
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
        </>
    ),
    target: (
        <>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </>
    ),
    zap: <path d="M15.914 4a1.5 1.5 0 0 0-2.474-1.561l-9 9A1.5 1.5 0 0 0 5.5 14h4.002a.5.5 0 0 1 .471.666L8.086 20a1.5 1.5 0 0 0 2.475 1.56l9-9A1.5 1.5 0 0 0 18.5 10h-3.997a.5.5 0 0 1-.472-.667z" />,
    plane: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
    dollarSign: (
        <>
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
    ),
    notebookPen: (
        <>
            <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
            <path d="M2 6h4" />
            <path d="M2 10h4" />
            <path d="M2 14h4" />
            <path d="M2 18h4" />
            <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
        </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronUp: <path d="m18 15-6-6-6 6" />,
    moreHorizontal: (
        <>
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
        </>
    ),
    x: (
        <>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </>
    ),
    pencil: (
        <>
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            <path d="m15 5 4 4" />
        </>
    ),
    trash: (
        <>
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </>
    ),
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    barChart: (
        <>
            <path d="M5 21v-6" />
            <path d="M12 21V3" />
            <path d="M19 21V9" />
        </>
    ),
    squareParking: (
        <>
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </>
    ),
    utensils: (
        <>
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </>
    ),
    car: (
        <>
            <path d="M19 17h2v-4l-2-5H5L3 13v4h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
            <path d="M5 17h8" />
        </>
    ),
    mountainSnow: (
        <>
            <path d="m8 3 4 8 5-5 5 15H2Z" />
            <path d="m4.14 15.08 2.86-2 2.13 2.14L11 12l1.5 2.5" />
        </>
    ),
    trees: (
        <>
            <path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h-.1A3 3 0 0 1 4 10.2V10a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3Z" />
            <path d="M7 16v6" />
            <path d="M17.6 9c.2-.4.4-.9.4-1.5a3.5 3.5 0 0 0-6.7-1.5" />
            <path d="M15 8.5c0 2.3-1.9 4.5-3 5.5h6c-1.1-1-3-3.2-3-5.5Z" />
            <path d="M15 14v8" />
        </>
    ),
    footprints: (
        <>
            <path d="M4 16v-2.4a3.6 3.6 0 0 1 7.2 0V16" />
            <path d="M4 21v-3" />
            <path d="M13 8v-2.4a3.6 3.6 0 0 1 7.2 0V8" />
            <path d="M13 21v-8.5" />
            <path d="M20.2 8H13" />
            <path d="M11.2 13.6H4" />
        </>
    ),
    landmark: (
        <>
            <path d="M3 22h18" />
            <path d="M6 18v-7" />
            <path d="M10 18v-7" />
            <path d="M14 18v-7" />
            <path d="M18 18v-7" />
            <path d="M2 11 12 4l10 7" />
        </>
    ),
    shoppingBag: (
        <>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </>
    ),
    bedDouble: (
        <>
            <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
            <path d="M2 17h20" />
            <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
        </>
    ),
    key: (
        <>
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="m21 2-9.6 9.6" />
            <path d="m15.5 7.5 3 3L22 7l-3-3" />
        </>
    ),
    luggage: (
        <>
            <path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z" />
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            <path d="M10 20v2" />
            <path d="M14 20v2" />
            <path d="M12 6v14" />
        </>
    ),
    idCard: (
        <>
            <rect width="18" height="14" x="3" y="5" rx="2" />
            <circle cx="9" cy="10" r="2" />
            <path d="M15 9h4" />
            <path d="M15 13h4" />
            <path d="M6.5 16a2.5 2.5 0 0 1 5 0" />
        </>
    ),
    moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
    circleEllipsis: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M17 12h.01" />
            <path d="M12 12h.01" />
            <path d="M7 12h.01" />
        </>
    ),
};

export function Icon({
    name,
    width = 24,
    height = 24,
    ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={width}
            height={height}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {icons[name]}
        </svg>
    );
}

export const Home = (props: SVGProps<SVGSVGElement>) => <Icon {...props} name="home" />;
export const Settings = (props: SVGProps<SVGSVGElement>) => <Icon {...props} name="settings" />;
