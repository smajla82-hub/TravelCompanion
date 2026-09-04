import type { ReactNode } from "react";

import { Icon } from "../ui";

import type { ItineraryItem } from "../../types";
import { getActivityTypeDefinition } from
    "../../domain/activity/ActivityTypeRegistry";
import { getPriorityColorVar } from
    "../../domain/activity/PriorityRegistry";
import { PARKING_COLOR_VAR } from
    "../../domain/activity/ParkingRegistry";
import type { IconName } from "../ui/icon";
import "./ActivitySummary.css";

type ActivitySummaryProps = {
    item: ItineraryItem;
};

type ActivityDetailProps = {
    icon: IconName;
    /** CSS color variable (e.g. "--color-priority-must") for the icon. */
    colorVar?: string;
    children: ReactNode;
};

function ActivityDetail({
    icon,
    colorVar,
    children,
}: ActivityDetailProps) {
    const iconStyle = colorVar
        ? ({ color: `var(${colorVar})` } as const)
        : undefined;

    return (
        <div className="activity-summary__detail">
            <span
                className="activity-summary__detail-icon"
                style={iconStyle}
            >
                <Icon name={icon} width={16} height={16} />
            </span>
            <span>{children}</span>
        </div>
    );
}

type ActivityDetailValueProps = {
    colorVar: string;
    children: ReactNode;
};

/** Highlights a Priority/Parking value with its semantic color. */
function ActivityDetailValue({
    colorVar,
    children,
}: ActivityDetailValueProps) {
    return (
        <strong style={{ color: `var(${colorVar})` }}>
            {children}
        </strong>
    );
}

export function ActivitySummary({
    item,
}: ActivitySummaryProps) {
    const activityTypeDefinition = getActivityTypeDefinition(
        item.activityType
    );

    return (
        <div className="activity-summary">
            <div
                className={`activity-summary__main${item.time ? "" : " activity-summary__main--no-time"}`}
            >
                <span className="activity-summary__type-icon">
                    <Icon
                        name={activityTypeDefinition.icon}
                        width={16}
                        height={16}
                        aria-label={activityTypeDefinition.label}
                    />
                </span>

                {item.time && (
                    <span className="activity-summary__time">
                        {item.time}
                    </span>
                )}

                <strong className="activity-summary__title">
                    {item.title}
                </strong>
            </div>

            <div className="activity-summary__details">
                {item.location && (
                    <ActivityDetail icon="mapPin">
                        {item.location}
                    </ActivityDetail>
                )}

                {item.priority && (
                    <ActivityDetail
                        icon="zap"
                        colorVar={getPriorityColorVar(item.priority)}
                    >
                        Priority:{" "}
                        <ActivityDetailValue
                            colorVar={getPriorityColorVar(item.priority)}
                        >
                            {item.priority}
                        </ActivityDetailValue>
                    </ActivityDetail>
                )}

                {item.parking && (
                    <ActivityDetail
                        icon="squareParking"
                        colorVar={PARKING_COLOR_VAR}
                    >
                        Parking:{" "}
                        <ActivityDetailValue colorVar={PARKING_COLOR_VAR}>
                            {item.parking}
                        </ActivityDetailValue>
                    </ActivityDetail>
                )}

                {item.smartChip && (
                    <ActivityDetail icon="mapPin">
                        {item.mapLink ? (
                            <a
                                href={item.mapLink}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {item.smartChip}
                            </a>
                        ) : (
                            item.smartChip
                        )}
                    </ActivityDetail>
                )}

                {item.price !== undefined &&
                    item.price !== null &&
                    item.price !== "" && (
                        <ActivityDetail icon="dollarSign">
                            Price: {item.price}
                        </ActivityDetail>
                    )}

                {item.note && (
                    <ActivityDetail icon="notebookPen">
                        Note: {item.note}
                    </ActivityDetail>
                )}
            </div>
        </div>
    );
}
