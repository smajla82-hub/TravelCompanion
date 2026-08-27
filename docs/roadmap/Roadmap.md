# Travel Companion — Roadmap

## 1. Project Vision

Travel Companion is a travel-planning application built around the Trip as the primary container for travel-related information.

The immediate practical goal is a usable application for the BlizzCon 2026 trip, including import of existing planning data and operation in an Android/mobile environment.

---

## 2. Development Model

- **Roadmap.md = map** — current state, milestones and direction.
- **SprintLog.md = history** — completed development history.
- Documentation is updated after completion of a major Feature/Milestone, not after every sub-step.
- Empty documentation files are completed when the corresponding part of the application has something meaningful to document.

---

## 3. Milestones

### Milestone 1 — Foundation
**3.x — DONE**

React application foundation, first functional dashboard, initial UI components and dashboard structure.

### Milestone 2 — Architecture & UI
**4.x — DONE**

Feature architecture, UI library, domain layer, dashboard refactoring and modal infrastructure.

### Milestone 3 — Trip Management
**5.x — IN PROGRESS**

Trip creation, validation, editing, deletion and stabilization of Trip state.

Next:
- 5.8 — Active Trip management
- 5.9 — Persistence

### Milestone 4 — Data Import
**6.x — PLANNED**

Import existing travel data, define the import format and map imported data into the domain model.

### Milestone 5 — BlizzCon Ready
**7.x — PLANNED**

Turn the application into a practical companion for the BlizzCon 2026 trip using real travel data.

### Milestone 6 — Mobile / Android
**8.x — PLANNED**

Make the application practical to use in an Android/mobile environment.

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

---

## 5. Current State

**Current Feature:** 5.7  
**Status:** DONE

The Trip management foundation currently supports:
- multiple Trips
- Trip creation
- form validation
- editing
- deletion
- Trip detail view
- active Trip state foundation
- modal-based interaction

Known next functional target:

**5.8 — Active Trip Management**

Then:

**5.9 — Persistence**

Then:

**Import → BlizzCon data → Android/mobile**

---

## 6. Next Development Order

1. 5.8 — Active Trip Management
2. 5.9 — Persistence
3. 6.x — Import
4. 7.x — BlizzCon / real travel data
5. 8.x — Android/mobile
6. 9.x+ — Extended travel functionality

The order is intentional: reliable state and persistence come before importing real data, and the core application should be stable before final mobile packaging.

---

## 7. Documentation Structure

- `architecture/` — architecture and technical structure
- `decisions/` — important architectural/implementation decisions
- `domains/` — business/domain definitions and rules
- `flows/` — important application/user workflows
- `glossary/` — domain terminology
- `presentation/` — major application views and presentation concepts
- `roadmap/` — roadmap and development history
- `standards/` — development standards and conventions
- `ux/` — UX decisions and principles

Documentation is expanded when implementation reaches the corresponding area.

---

## 8. Handoff Principle

A new developer or AI agent should be able to understand:
1. what the project is,
2. what has been completed,
3. what the current Feature is,
4. what the next Feature is,
5. where relevant documentation lives,
6. which parts are planned rather than implemented.

Repository documentation is part of project continuity.
