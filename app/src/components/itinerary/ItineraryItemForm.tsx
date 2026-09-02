import { Button, Stack } from "../ui";
import "../trips/NewTripModal.css";

import { useState } from "react";

import type { ItineraryItem } from "../../types";

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
  const [goal, setGoal] = useState(item?.goal ?? "");
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
      title,
      description,
      location,
      goal,
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
            type="text"
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
          Goal
          <input
            type="text"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />
        </label>
        <label>
          Priority
          <input
            type="text"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          />
        </label>
        <label>
          Parking
          <input
            type="text"
            value={parking}
            onChange={(event) => setParking(event.target.value)}
          />
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
