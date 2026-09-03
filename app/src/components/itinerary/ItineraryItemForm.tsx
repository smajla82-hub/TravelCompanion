import { Button, Stack } from "../ui";
import "../trips/NewTripModal.css";

import { useState } from "react";

import type { ItineraryItem } from "../../types";
import {
  ACTIVITY_TYPE_REGISTRY,
  ACTIVITY_TYPE_IDS,
  normalizeActivityType,
} from "../../domain/activity/ActivityTypeRegistry";
import { normalizeActivityTitle } from
  "../../domain/activity/normalizeActivityTitle";

const PRIORITY_OPTIONS = [
  "MUST",
  "FOOD",
  "DRIVE",
  "OPTIONAL",
  "PHOTO",
  "SUNSET",
  "HOTEL",
  "BREAK",
];

const PARKING_OPTIONS = ["", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

export type ItineraryItemFields = Omit<ItineraryItem, "id" | "date">;

type ItineraryItemFormProps = {
  item?: ItineraryItem;
  onSubmit: (item: ItineraryItemFields) => void;
};

export function ItineraryItemForm({ item, onSubmit }: ItineraryItemFormProps) {
  const [time, setTime] = useState(item?.time ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [activityType, setActivityType] = useState(
    normalizeActivityType(item?.activityType)
  );
  const [priority, setPriority] = useState(item?.priority ?? "");
  const [parking, setParking] = useState(item?.parking ?? "");
  const [smartChip, setSmartChip] = useState(item?.smartChip ?? "");
  const [mapLink, setMapLink] = useState(item?.mapLink ?? "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [note, setNote] = useState(item?.note ?? "");

  function validate() {
    if (!title.trim()) {
      alert("Title is required.");

      return false;
    }

    return true;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      time,
      title: normalizeActivityTitle(title),
      description,
      location,
      goal: item?.goal,
      activityType,
      priority,
      parking,
      smartChip,
      mapLink,
      price,
      note,
    });
  }

  return (
    <form className="tc-trip-form" onSubmit={handleSubmit}>
      <Stack gap="md">
        <label>
          Time
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </label>
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Description
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label>
          Location
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </label>
        <label>
          Activity Type
          <select
            value={activityType}
            onChange={(event) =>
              setActivityType(normalizeActivityType(event.target.value))
            }
          >
            {ACTIVITY_TYPE_IDS.map((id) => (
              <option key={id} value={id}>
                {ACTIVITY_TYPE_REGISTRY[id].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="">None</option>
            {PRIORITY_OPTIONS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Parking
          <select
            value={parking}
            onChange={(event) => setParking(event.target.value)}
          >
            {PARKING_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value || "None"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Smart Chip
          <input
            type="text"
            value={smartChip}
            onChange={(event) => setSmartChip(event.target.value)}
          />
        </label>
        <label>
          Map Link
          <input
            type="text"
            value={mapLink}
            onChange={(event) => setMapLink(event.target.value)}
          />
        </label>
        <label>
          Price
          <input
            type="text"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>
        <label>
          Note
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <Button type="submit">Save Activity</Button>
      </Stack>
    </form>
  );
}
