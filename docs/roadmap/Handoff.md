# Travel Companion — Handoff

## Purpose

This document provides the minimum context required for another developer or AI agent to continue Travel Companion without reconstructing the project history from the conversation.

---

## Project

**Travel Companion**

A travel-planning companion centered around the **Trip** domain.

The current application is a React + TypeScript application built with Vite.

The architecture is intentionally being developed as a platform for travel data rather than as a one-off BlizzCon itinerary viewer.

---

## Current State

**Feature 6.0 — DONE through 6.0.11**

Current sequence:

**5.8 Active Trip → 5.9 Persistence → 6.0 RoadBook/XLSX Import & Itinerary Integration → 7.x BlizzCon Ready → 8.x Android**

The application currently has a functional Trip domain, persistent Trip state, XLSX RoadBook import, RoadBook persistence inside a Trip, and itinerary/day detail views driven by the active Trip.

The current verified milestone is **6.0.11**.

---

## Current Architecture

The **Trip** is the primary container for travel-related data.

Relevant relationship:

```text
Trip
 └── itinerary
      └── ItineraryDay[]
           └── items: ItineraryItem[]
```

The active itinerary is obtained from the active Trip rather than from a separate global/demo itinerary.

Current flow:

```text
ItinerarySection
      ↓
TripService.getActive()
      ↓
Active Trip
      ↓
activeTrip.itinerary
      ↓
ItineraryDay[]
      ↓
ItineraryDayCard
      ↓
ItineraryDayDetail
```

RoadBook import flow:

```text
XLSX file
   ↓
XlsxRoadBookImporter
   ↓
ItineraryDay[]
   ↓
RoadBookImport
   ↓
selected Trip
   ↓
Trip.itinerary
   ↓
persistent Trip state
```

---

## Current Trip Functionality

- viewing Trips
- creating Trips
- validation
- editing Trips
- deleting Trips
- viewing Trip details
- selecting an Active Trip
- Active Trip-driven dashboard data
- persistence of Trip state
- persistence verification across refresh
- persistence of imported RoadBook data
- multiple Trips with independent itinerary data

---

## Current RoadBook / Itinerary Functionality

The application can:

- select a Trip for RoadBook import
- upload an `.xlsx` RoadBook
- parse multiple day sheets
- convert imported rows into `ItineraryDay` / `ItineraryItem` domain data
- display imported day and activity counts
- preview imported RoadBook data
- save the imported RoadBook to the selected Trip
- keep the RoadBook associated with that Trip
- load the saved RoadBook after refresh
- display itinerary days from the Active Trip
- display day cards
- open a day detail view
- close the day detail view and return to the day list
- display the activity data belonging to the selected day

The current test RoadBook contains **8 days / 150 activities** and has been successfully imported and persisted.

The XLSX importer currently uses the existing RoadBook column names from the source workbook, including fields such as time, destination/goal, note, price and parking-related data. A future import-template standardization to English is intentionally deferred.

---

## Important Current Files

### Domain types

- `app/src/types/Trip.ts`
- `app/src/types/ItineraryDay.ts`
- `app/src/types/ItineraryItem.ts`
- `app/src/types/index.ts`

### Services

- `app/src/services/TripService.ts`
- `app/src/services/import/XlsxRoadBookImporter.ts`

### Import components

- `app/src/components/import/RoadBookImport.tsx`
- `app/src/components/import/RoadBookPreview.tsx`
- `app/src/components/import/index.ts`

### Itinerary components

- `app/src/components/itinerary/ItineraryCard.tsx`
- `app/src/components/itinerary/ItineraryDayDetail.tsx`
- `app/src/components/itinerary/index.ts`

### Sections

- `app/src/components/sections/ItinerarySection.tsx`

---

## Repository Areas

Important application areas include:

- `src/components`
- `src/hooks`
- `src/services`
- `src/types`
- `src/data`
- `src/pages`
- `src/store`
- `src/layouts`
- `src/routes`

Documentation:

- `docs/architecture`
- `docs/decisions`
- `docs/domains`
- `docs/flows`
- `docs/glossary`
- `docs/presentation`
- `docs/roadmap`
- `docs/standards`
- `docs/ux`

---

## Documentation Authority

- `docs/roadmap/Roadmap.md` — project direction and milestones
- `docs/roadmap/SprintLog.md` — human-readable development history
- `docs/roadmap/Handoff.md` — current continuity context
- Git — exact commit history and repository state

The repository is the source of truth for the current implementation. Documentation describes intent, architecture and history.

---

## Development Workflow

For each Feature:

1. define the functional goal,
2. implement related sub-steps,
3. test,
4. fix problems,
5. commit/push after verification,
6. update documentation when the major Feature/Milestone is complete.

The user performs the actual implementation, testing, commit and push.

### CLI working directory

The dedicated CLI terminal is normally kept at:

```text
/c/APCODE/Travel Companion/app
```

Therefore CLI commands for files inside `src/` should normally be relative to `app/`.

Do not prepend `app/` when the command is executed from the `app` directory.

### Code delivery rule

When modifying a source file:

- If the complete file is reasonably small, provide the **entire replacement file**.
- If it is above the agreed practical size limit, provide the relevant replacement segment.
- Avoid forcing manual search-and-replace when a complete file is practical.
- Agreed threshold: approximately **200 lines** for a complete-file replacement, with **300 lines as the upper boundary** where segment-based changes become preferable.

Always provide the **full file path as copyable text** before a file replacement.

For a new file, also provide the CLI command needed to create it.

The user handles Git operations.

---

## Current Priorities

The practical deadline is the BlizzCon 2026 trip.

Priority:

1. reliable Trip state
2. persistence
3. usable RoadBook / itinerary data
4. BlizzCon-specific functionality
5. usable Android/mobile environment
6. later cosmetic and extended travel features

Cosmetic polishing should not unnecessarily block functional progress.

---

## Known Follow-up Areas

Some details are intentionally deferred:

- final visual polish
- mobile interaction affordances
- final responsive/mobile layout
- standardized English XLSX import template
- extended itinerary functionality
- broader travel features such as budget/checklists/currency

The current XLSX importer is tied to the existing RoadBook workbook structure. This is acceptable for the current BlizzCon workflow; template standardization is a future task.

---

## Continuity Rule

Before starting a new Feature, inspect the current relevant source files and roadmap documentation.

Do not assume an older conversation state is identical to the repository.

When repository state contradicts an older plan, treat the current repository and verified behavior as authoritative and document the change.

The next development target after the completed **6.0.11** work is **6.0.12**, unless the Roadmap is deliberately changed.
