# Travel Companion — Handoff

## Purpose

This document provides the minimum context required for another developer or AI agent to continue Travel Companion without reconstructing the project history from the conversation.

---

## Project

**Travel Companion**

A travel-planning companion centered around the **Trip** domain.

The project is currently a React application.

---

## Current State

**Feature 5.7 — DONE**

Current sequence:

**5.8 Active Trip → 5.9 Persistence → Import → BlizzCon → Android**

---

## Current Trip Functionality

- viewing Trips
- creating Trips
- validation
- editing Trips
- deleting Trips
- viewing Trip details
- active Trip state foundation

The application uses a Trip service and React hooks/components around that service.

---

## Repository Areas

Important application areas include:

- `components`
- `hooks`
- `services`
- `types`
- `data`
- `pages`

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
- Git — exact commit history

---

## Development Workflow

For each Feature:

1. define the functional goal,
2. implement related sub-steps,
3. test,
4. fix problems,
5. commit/push after verification,
6. update documentation when the major Feature is complete.

### Code delivery rule

When modifying a source file:

- If the complete file is reasonably small, provide the **entire replacement file**.
- If it is above the agreed practical size limit, provide the relevant replacement segment.
- Avoid forcing manual search-and-replace when a complete file is practical.
- Agreed threshold: approximately **200 lines** for a complete-file replacement, with **300 lines as the upper boundary** where segment-based changes become preferable.

The user performs actual file replacement and Git operations.

---

## Current Priorities

The practical deadline is the BlizzCon 2026 trip.

Priority:

1. reliable Trip state
2. persistence
3. import of existing travel data
4. BlizzCon-specific data
5. usable Android/mobile environment
6. later cosmetic and extended travel features

Cosmetic polishing should not unnecessarily block functional progress.

---

## Known Follow-up Areas

Some UI details are intentionally deferred:

- spacing between action buttons
- mobile interaction affordances
- hover-state visibility
- final visual polish
- final itinerary integration

The itinerary currently contains data that is not automatically synchronized with Trip deletion. This is known.

---

## Continuity Rule

Before starting a new Feature, inspect the current relevant source files and roadmap documentation.

Do not assume an older conversation state is identical to the repository.

When repository state contradicts an older plan, treat the current repository and verified behavior as authoritative and document the change.
