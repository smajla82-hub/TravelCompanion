# Domain Model

# Document Information

| Property | Value |
|----------|-------|
| Version | 0.1.0 |
| Status | Approved |

---

# Core Domains

Travel Companion consists of independent business domains.

---

## Trip

Represents one complete journey.

---

## Itinerary

Each Trip may contain one itinerary:

```text
Trip
 └── itinerary
      └── ItineraryDay[]
           └── items: ItineraryItem[]
```

### ItineraryDay

Represents one dated itinerary day and its ordered activities.

### ItineraryItem

Represents one activity in an itinerary day. `activityType` is its explicit semantic classification and selects the canonical UI icon. Supported canonical values are `food`, `flight`, `transport`, `scenic`, `nature`, `walk`, `sightseeing`, `event`, `shopping`, `accommodation`, `parking`, `car_rental`, `travel_prep`, `airport`, `rest` and `other`; missing or unknown values resolve to `other`.

The legacy `goal` field is deprecated and retained only so older persisted data remains compatible. New importer and UI flows do not populate or render it.

---

## Future Domains

The following domains remain long-term concepts and are not current itinerary-model entities:

## Location

Global reusable locations.

Examples:

- Hotel
- Airport
- Museum
- Restaurant
- Parking

---

## Equipment

Personal travel equipment.

Reusable between trips.

---

## Document

Travel related files.

Examples:

- Boarding Pass
- Passport
- Insurance
- Tickets
- Reservations

---

## Expense

Financial transactions.

Categories determine behaviour.

---

## Knowledge

Personal travel knowledge.

Reusable across all trips.

---

# Domain Relationships

Trip

↓

Timeline

↓

Location

↓

Expense

↓

Document

Every domain remains independent.

Communication happens through references.

---

# Shared Principles

Every domain follows the same rules.

Every object has:

- UUID
- Created
- Modified
- Status
- Notes
- Attachments
- Tags
- History

---

# Future Features

- AI Assistant
- Collaboration
- Synchronization
- Notifications