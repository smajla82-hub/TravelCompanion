# Travel Companion — Roadmap

## 1. Project Vision

Travel Companion is a travel-planning application built around the **Trip** as the primary container for travel-related information.

The immediate practical goal is a usable application for the **BlizzCon 2026 trip**, including import of existing planning data, reliable persistence and operation in an Android/mobile environment.

The long-term goal is a modular travel platform rather than a single-purpose itinerary viewer.

---

## 2. Development Model

- **Roadmap.md = map** — current state, milestones and direction.
- **SprintLog.md = history** — completed development history.
- **Handoff.md = continuity** — minimum context required to continue development.
- Documentation is updated after completion of a major Feature/Milestone, not after every implementation step.
- Git remains authoritative for exact commit history and repository state.

---

## 3. Milestones

### Milestone 1 — Foundation
**3.x — DONE**

React application foundation, first functional dashboard, initial UI components and dashboard structure.

### Milestone 2 — Architecture & UI
**4.x — DONE**

Feature architecture, UI library, domain layer, dashboard refactoring and modal infrastructure.

### Milestone 3 — Trip Management
**5.x — DONE**

Trip creation, validation, editing, deletion, Active Trip management and persistence.

### Milestone 4 — Data Import & Itinerary
**6.x — IN PROGRESS**

Import existing RoadBook/XLSX planning data, map it into the domain model, persist it inside Trips and expose it through the Active Trip itinerary. Includes in-app itinerary editing (add/edit/delete/reorder activities) and the redesigned itinerary day view (real-time current/next activity, per-activity Food/Parking, day-level Statistics).

Completed through **6.0.16**.

### Milestone 5 — BlizzCon Ready
**7.x — PLANNED**

Turn the application into a practical companion for the BlizzCon 2026 trip using the imported real travel data. Based on the user's dashboard mockup, this milestone reworks the app's home/dashboard experience around "what's happening right now" rather than a static list of days, and introduces a dedicated Settings area.

Planned sub-steps:

- **7.1 — Dashboard "Current Activity" view**
  - The dashboard shows the Active Trip's **current/next activity** directly (based on the real device date/time), instead of requiring the user to open a day from a list.
  - A new **"View whole Itinerary"** entry point opens the existing full day-list view (the itinerary day cards / day-detail flow built in 6.x) as a separate, explicit view rather than the default dashboard state.
  - **"Continue Trip"** is redefined: instead of scrolling to a section, it returns the user to the Active Trip's current date/time view (e.g. after browsing a different day, editing a different Trip, or navigating elsewhere).
  - Edge cases: if the Active Trip's date range hasn't started yet, show a "Trip starts in X days" message; if it has already ended, show a "Trip has ended" message — both linking to "View whole Itinerary".
  - No Trip is required to be Active at all — the dashboard must also handle the no-Active-Trip state gracefully (as it does today).

- **7.2 — Settings**
  - A new **Settings** entry (bottom of the app, replacing the current dashboard-level "Import RoadBook" entry point).
  - Settings houses: **Import RoadBook** (moved here from its current dashboard placement), **Export data** (JSON backup of all Trips/itineraries), **Import backup** (restore from a previously exported JSON backup — distinct from the XLSX RoadBook import), and a **Dark/Light mode** toggle, with room for further app-wide preferences as they're identified.

### Milestone 5.5 — UI/UX Polish
**7.5.x — PLANNED**

A dedicated, holistic visual/UX redesign pass across the whole application (not just the itinerary view), once the functional feature set from 7.x is stable. Expected scope includes:
- Consistent sizing/spacing of buttons and controls across the entire app (the per-activity action buttons introduced in 6.x are functional but oversized; a systemic sizing pass is deferred here rather than fixed piecemeal).
- Correcting cosmetic/demo remnants (e.g. the hardcoded Italian flag shown on every Trip card regardless of actual country).
- Full application of the user's dashboard/home redesign mockup (introduced in 7.x functionally) to the rest of the app's visual language.
- General visual consistency, responsive/mobile layout polish.

This milestone intentionally follows 7.x (BlizzCon Ready) so the redesign is informed by a functionally complete, real-data-tested application rather than redesigning around a moving target.

### Milestone 6 — Mobile / Android
**8.x — PLANNED**

Make the application practical to use in an Android/mobile environment (PWA installability, service worker, responsive/touch polish).

### Milestone 7 — Extended Travel Companion
**9.x+ — PLANNED**

Additional travel functionality, including:
- Budget
- Checklist
- Currency
- Timeline
- Equipment
- Knowledge Base
- other travel-related features

---

## 4. Completed Development

### 3.x — Foundation

- 3.0 — Bootstrap React application
- 3.1 — First own React application
- 3.2 — First own React application
- 3.3.1 — index creation
- 3.3.3 — Button
- 3.3 — First functional dashboard
- 3.4.3 — Grid component
- 3.4.5 — UI Barrel transition
- 3.5 — Dashboard Foundation
- 3.6 — Design System Foundation
- 3.7 — Trip Management Foundation
- 3.8 — First Feature
- 3.9 — My Trips

### 4.x — Architecture & UI

- 4.0 — Feature Architecture
- 4.1 — UI Library v2
- 4.2 — Domain Layer
- 4.3A — Dashboard Refactoring
- 4.5 — Active Trip selection
- 4.7.1 — Modal component
- 4.7B — Modal usage
- 4.8.1 — Modal improvements
- 4.8.2 — Modal animations

### 5.x — Trip Management

- 5.0 — Trip Management
- 5.1.3 — Modal connection
- 5.2 — Creating Trips
- 5.3 — Form Validation
- 5.4A — Form Hotfix
- 5.5 — Edit Existing Trip
- 5.6 — Edit Existing Trip
- 5.7.5–5.7.8 — Trip state stabilization
- 5.8 — Active Trip Management
- 5.9 — Persistence

### 6.x — Data Import & Itinerary

- 6.0.1–6.0.5 — RoadBook/XLSX import foundation
- 6.0.6–6.0.8 — XLSX parsing, import UI and RoadBook preview
- 6.0.9 — RoadBook persistence into a selected Trip
- 6.0.10 — Active Trip itinerary integration
- 6.0.11 — Itinerary day cards and day-detail interaction
- 6.0.12 — Recommended venues and day statistics import
- 6.0.13 — Fixed duplicated recommended venues in the timeline; preserved Google Maps smart-chip links
- 6.0.14 — In-app itinerary editing (add/edit/delete/reorder activities)
- 6.0.14.1 — Immutable itinerary updates (realtime UI refresh) and consolidated per-item "Manage" action
- 6.0.15 — Itinerary day view redesign: real-time current/next activity, per-activity Food/Parking, day-level Statistics
- 6.0.16 — Meal-type-aware Food filtering, Active Trip switching and Continue Trip fixes

All work through **6.0.16** has been implemented and functionally tested.

---

## 5. Current State

**Current Milestone:** 6.x — Data Import & Itinerary  
**Current completed Feature:** 6.0.16  
**Status:** DONE through 6.0.16

The Trip system currently supports:

- multiple Trips
- Trip creation
- form validation
- editing
- deletion
- Trip detail view
- Active Trip selection
- persistent Trip state
- persisted RoadBook data

The RoadBook/itinerary system currently supports:

- XLSX upload
- multi-day RoadBook parsing
- conversion to `ItineraryDay[]`
- conversion of activity rows to `ItineraryItem[]`
- import preview
- saving RoadBook to a selected Trip
- persistence across refresh
- Active Trip-driven itinerary display
- day cards
- day-detail opening/closing
- display of day activities
- recommended venues, parking locations and flexible day statistics
- Google Maps links preserved from smart-chip cells
- in-app add/edit/delete/reorder of itinerary activities, with immediate (no manual refresh) UI updates
- real-time current/next activity highlighting for the active day
- per-activity Food/Parking buttons and a day-level Statistics button
- meal-type-aware Food venue filtering with venue subtype details
- automatic itinerary close when switching the Active Trip
- Continue Trip scrolling to the itinerary section

Verified test data currently imports as:

**8 days · 150 activities**

---

## 6. Next Development Order

1. 7.1 — Dashboard "Current Activity" view (current/next activity, "View whole Itinerary", redefined Continue Trip)
2. 7.2 — Settings (Import RoadBook relocation, Export/Import backup, Dark/Light mode)
3. 7.5.x — UI/UX Polish (holistic visual/UX redesign)
4. 8.x — Android/mobile
5. 9.x+ — Extended travel functionality

The order remains intentional: reliable state and persistence are established before expanding the real-trip experience, the application is validated against real BlizzCon data before a holistic visual redesign is undertaken, and the application should be functionally stable before final mobile packaging.

---

## 7. Deferred Decisions / Future Work

### XLSX template

The current importer intentionally follows the existing RoadBook workbook structure and its current column names. The user is evolving the RoadBook workbook itself (e.g. standardizing the "Typ" column in DOPORUČENÉ PODNIKY to a consistent meal-time value — Breakfast/Lunch/Dinner/CoffeeBreak — with the previous free-text subtype, e.g. Burger/Mexican/Café, moved to a new "Poznámka" column), which the importer will be updated to follow as these data-shape changes land.

A future version should define a stable, English-language import template so future RoadBooks can be prepared independently of the original workbook language.

This is **not** a blocker for the current BlizzCon RoadBook.

### UI / UX

Final responsive/mobile polish and the holistic visual/UX redesign are deferred to Milestone 7.5, after the application is validated against real BlizzCon data (7.x). The user has provided a dashboard/home mockup guiding the functional dashboard rework in 7.1; a full visual-language pass across the rest of the app follows in 7.5.x.

### Backup / data safety

Since the application stores all Trip/itinerary data in browser `localStorage` only, Export/Import backup (7.2) is treated as a near-term priority rather than a "nice to have" — it mitigates the real risk of data loss (browser cache clearing, device change, reinstall) before/during actual real-world trip use.

### Extended travel platform

Budget, checklist, currency, timeline, equipment, knowledge base and related modules remain later milestones.

---

## 8. Documentation Structure

- `architecture/` — architecture and technical structure
- `decisions/` — important architectural/implementation decisions
- `domains/` — business/domain definitions and rules
- `flows/` — important application/user workflows
- `glossary/` — domain terminology
- `presentation/` — major application views and presentation concepts
- `roadmap/` — roadmap, SprintLog and Handoff
- `standards/` — development standards and conventions
- `ux/` — UX decisions and principles

Documentation is expanded when implementation reaches the corresponding area.

---

## 9. Handoff Principle

A new developer or AI agent should be able to understand:

1. what the project is,
2. what has been completed,
3. what the current milestone is,
4. what the next Feature is,
5. where relevant documentation lives,
6. which parts are planned rather than implemented,
7. the current Trip → Itinerary architecture.

Repository documentation is part of project continuity.
