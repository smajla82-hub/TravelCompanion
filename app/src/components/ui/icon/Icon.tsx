import type { SVGProps } from "react";

export type IconName = "home" | "settings" | "calendar" | "star" | "chevron";

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
    const paths: Record<IconName, string> = {
        home: "M3 10.5 12 3l9 7.5M5 9v11h14V9M9 20v-6h6v6",
        settings: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12a7 7 0 0 0-.2-1.6l2-1.2-2-3.4-2.1 1.2a8 8 0 0 0-2.8-1.6V3h-4v2.4a8 8 0 0 0-2.8 1.6L5 5.8 3 9.2l2 1.2A7 7 0 0 0 5 12c0 .6.1 1.1.2 1.6l-2 1.2 2 3.4 2.1-1.2a8 8 0 0 0 2.8 1.6V21h4v-2.4a8 8 0 0 0 2.8-1.6l2.1 1.2 2-3.4-2-1.2c.1-.5.2-1 .2-1.6Z",
        calendar: "M5 4v3M19 4v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
        star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
        chevron: "m9 5 7 7-7 7",
    };
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d={paths[name]} /></svg>;
}

export const Home = (props: SVGProps<SVGSVGElement>) => <Icon {...props} name="home" />;
export const Settings = (props: SVGProps<SVGSVGElement>) => <Icon {...props} name="settings" />;