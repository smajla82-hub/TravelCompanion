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
- **Mobile verification rule (introduced after 8.1):** any UI/UX change must be verified on desktop first, then re-verified on a real mobile device (via the GitHub Pages deployment) before it is considered DONE. Desktop-only verification is no longer sufficient for UI/UX-affecting work.

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
**6.x — DONE**

Import existing RoadBook/XLSX planning data, map it into the domain model, persist it inside Trips and expose it through the Active Trip itinerary. Includes in-app itinerary editing (add/edit/delete/reorder), real-time current/next activity highlighting and per-activity Food/Parking/Statistics.

Completed through **6.0.16**.

### Milestone 5 — BlizzCon Ready
**7.x — IN PROGRESS**

Turn the application into a practical companion for the BlizzCon 2026 trip using the imported real travel data. Based on the user's dashboard mockup, this milestone reworks the app's home/dashboard experience around the Active Trip.

Planned sub-steps:

- **7.1 — Dashboard "Current Activity" view** — **DONE**
  - The dashboard shows the Active Trip's **current/next activity** directly (based on the real device date/time), instead of requiring the user to open a day from a list.
  - A new **"View whole Itinerary"** entry point opens the existing full day-list view (the itinerary day cards / day-detail flow built in 6.x) as a separate, explicit view rather than the default.
  - **"Continue Trip"** is redefined: instead of scrolling to a section, it returns the user to the Active Trip's current date/time view (e.g. after browsing a different day, editing a different Trip, etc.).
  - Edge cases: if the Active Trip's date range hasn't started yet, show a "Trip starts in X days" message; if it has already ended, show a "Trip has ended" message — both linking to "View whole Itinerary".
  - No Trip is required to be Active at all — the dashboard must also handle the no-Active-Trip state gracefully (as it does today).

- **7.2 — Settings** — **DONE**
  - A new **Settings** entry (bottom of the app, replacing the current dashboard-level "Import RoadBook" entry point).
  - Settings houses: **Import RoadBook** (moved here from its current dashboard placement), **Export data** (JSON backup of all Trips/itineraries), **Import backup** (restore from a previously exported JSON backup, with overwrite confirmation).
  - The Settings entry point placement is intentionally minimal/provisional pending 7.5.x UI/UX Polish.

### Milestone 5.5 — UI/UX Polish
**7.5.x — DONE (including 7.5.2, 7.5.3, 7.5.4 refinements)**

A dedicated, holistic visual/UX redesign pass across the whole application (not just the itinerary view), once the functional feature set from 7.x is stable. Completed scope included:
- Consistent sizing/spacing of buttons and controls across the entire app.
- Correcting cosmetic/demo remnants (e.g. the hardcoded Italian flag shown on every Trip card regardless of actual country).
- Full application of the user's dashboard/home redesign mockup (`appka_navrh_look.png`) to the rest of the app's visual language, including a centralized design-token stylesheet, dedicated My Trips page, unified Current/Next Activity cards with in-card Food/Parking/Statistics actions, refined decorative gradient-card graphic, color-differentiated trip start/end messaging, and reconciled mobile-first tokens against `docs/ux/UserJourney.md`.
- General visual consistency, responsive/mobile layout polish.

`docs/ux/UserJourney.md` was corrected (broken diacritics/icon glyphs) and is treated as the authoritative UX/design-token reference for all future UI work.

**Note:** this milestone covered the *structural/functional* redesign pass (layout unification, design tokens, spacing). The *final visual finish* (activity-type icon set, typography refinement, and other purely cosmetic polish informed by the user's own visual design work) is intentionally tracked separately as **Milestone 6.5 (9.x — Final UI Look — Polish)** below, once the user's updated visual reference material is ready.

### Milestone 6 — Mobile / Android
**8.x — DONE (through 8.1)**

Make the application practical to use in an Android/mobile environment (PWA installability, service worker, responsive/touch polish, real-device verification).

- **8.1 — PWA installability & GitHub Pages deployment** — **DONE**
  - PWA manifest, placeholder branded icons, `vite-plugin-pwa`-based service worker (app-shell precaching only), mobile/touch audit (touch target sizing, viewport meta, safe-area insets, theme-color), and a GitHub Actions workflow deploying the app to GitHub Pages.
  - **Verified end-to-end on a real Android device** (both `localhost` during development and the deployed GitHub Pages URL): installation to the home screen, standalone/full-screen launch, and a full functional pass across Trip creation, itinerary browsing, Food/Parking/Statistics modals, Dark/Light mode and Export/Import — no issues found.

### Milestone 6.5 — Final UI Look — Polish
**9.x — PLANNED**

A final, dedicated cosmetic-finish pass, sequenced after Mobile/Android (8.x) is functionally verified but before Shared Persistence & Accounts (10.x), since accounts/sync work should build on top of a visually finished app rather than a moving visual target. Scope depends on the user's own visual design work, expected to include:

- **9.1 — Activity-type icon set** — dedicated icons per activity type (breakfast, dinner, flight departure/arrival, etc.), replacing the current generic/placeholder icon used across all activity types (deferred from 7.x/7.5.x).
- **9.2 — Typography refinement** — final font-weight/size pass across headings, body text and labels per the user's updated visual reference.
- **9.3 — General cosmetic polish** — any remaining spacing, color or component-level visual refinements identified once the user's updated `docs/ux/UserJourney.md`/mockup material is provided, verified per the Development Model's mobile-verification rule (desktop first, then real Android device).

This milestone will be planned in detail once the user provides the corresponding visual reference material (icons, typography, any other look-and-feel updates).

### Milestone 7 — Shared Persistence & Accounts
**10.x — PLANNED**

Introduce user accounts and shared/synced Trip data across multiple devices and travelers, replacing the current browser-`localStorage`-only persistence model. This is a distinct architectural shift from the mobile/UI work in 7.x/7.5.x/8.x/9.x and is intentionally sequenced as its own milestone because it introduces a server-side component, authentication and multi-device data consistency concerns that do not exist today.

**Backend architecture decision:** confirmed — see `docs/decisions/ADR-003-Backend-Architecture.md`. The user will self-host a Node.js/Express API backed by SQLite, on their own Linux server with a static public IP, fronted by Caddy (reverse proxy + automatic Let's Encrypt TLS) and a free DuckDNS dynamic-DNS hostname, with the existing `pm2` process manager on that server used to run the API process.

Proposed scope:

- **10.1 — Architecture decision & backend foundation** — **NEXT UP**
  - Provision the DuckDNS hostname and verify it resolves to the server's static IP.
  - Set up Caddy as a reverse proxy in front of the new API, using the DuckDNS hostname to obtain and auto-renew a Let's Encrypt TLS certificate, so the GitHub-Pages-hosted (HTTPS) frontend can call the backend over HTTPS without mixed-content blocking.
  - Scaffold a minimal Node.js/Express (or Fastify) API with a SQLite database (accessed via a lightweight query layer/ORM — exact choice to be confirmed when this feature is scoped in detail), managed as a `pm2` process on the user's server.
  - Define the initial REST API surface needed to replace direct `localStorage` reads/writes: Trip CRUD, itinerary CRUD, Active Trip selection, at minimum.
  - Record the finalized decision and its consequences in `docs/decisions/ADR-003-Backend-Architecture.md` (already created; refine further once implementation details are confirmed).

- **10.2 — Authentication**
  - Simple email + password account creation and login, issuing a session/JWT token used by the frontend for subsequent API calls. No OAuth/social login required for the initial version.
  - Basic account-level data isolation: each user's Trips belong to their account.

- **10.3 — Shared Trip access**
  - Mechanism for a Trip to be shared/visible across multiple accounts (e.g. co-travelers), since a Trip may be jointly planned/edited by more than one person. Exact sharing model (invite-by-email, shareable link, explicit collaborator list) to be defined during this feature's planning.

- **10.4 — Sync & conflict handling**
  - Define and implement the initial (deliberately simple) conflict-resolution strategy for concurrent/offline edits to the same Trip from multiple devices — the current working assumption is a **last-write-wins** strategy based on server-recorded timestamps for the initial version, with more sophisticated per-field merging or explicit conflict-resolution UI deferred as future work.
  - The app must continue to support fully offline usage (current `localStorage`-first behavior) with sync occurring opportunistically when connectivity is available, rather than requiring a constant server connection.

- **10.5 — Data migration**
  - One-time migration/import path for a user's existing local-only `localStorage` Trips/itineraries into their newly created account, so no existing BlizzCon planning data is lost when accounts are introduced.

- **10.6 — Operations**
  - Document the operational runbook for the self-hosted server component (the user already runs `pm2` on the server): process start/restart, SQLite backup strategy, Caddy/TLS renewal monitoring, and basic uptime expectations.

### Milestone 8 — Extended Travel Companion
**11.x+ — PLANNED**

Additional travel functionality, including:
- Budget
- Checklist
- Currency
- Timeline
- Equipment
- Knowledge Base
- other travel-related features

Expected to build on top of the shared persistence/accounts foundation (10.x) once it exists.

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

**Current Milestone:** 8.x — Mobile / Android
**Current completed Feature:** 8.1
**Status:** DONE through 8.1 (real-device verified). Next planned milestone: 9.x — Final UI Look — Polish, followed by 10.x — Shared Persistence & Accounts.

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
- current and next activity view on the dashboard
- "View whole Itinerary" day-list entry point
- date-range edge-case messaging (color-differentiated, centered)
- Continue Trip reset to the current-activity view with itinerary scrolling
- dedicated `/settings` page
- Import RoadBook relocated from the dashboard to Settings
- JSON Export data backup for all Trips
- JSON Import backup restore with overwrite confirmation
- persisted Dark/Light mode toggle
- `appka_navrh_look.png` visual redesign with centralized design tokens, responsive dashboard polish, inline icons, consolidated buttons, fixed navigation and full dark-mode component coverage
- white-text colored gradient header band matching `appka_navrh_look.png` in both light and dark mode
- corrected Active Trip card internal layout (bottom-centered Continue Trip button, status-dot badge detail)
- automatic navigation to Home after setting a Trip active from the My Trips page
- Food/Parking/Statistics action stack now also visible on the dashboard's Current/Next Activity blocks, with read-only informational modals
- legible modal text/close button in dark mode
- unified Current/Next Activity cards with in-card Food/Parking/Statistics actions
- refined CSS decorative pattern on the Active Trip gradient card
- centered, color-differentiated trip start/end messaging and reconciled mobile-first design tokens
- installable PWA (manifest, branded placeholder icons, app-shell service worker) deployed to GitHub Pages
- mobile/touch audit fixes: touch target sizing, viewport/theme-color meta, Android safe-area insets
- **end-to-end verified on a real Android device** (both local dev server and the deployed GitHub Pages build) across Trip creation, itinerary browsing, Food/Parking/Statistics modals, Dark/Light mode and Export/Import — no issues found

Verified test data currently imports as:

**8 days · 150 activities**

---

## 6. Next Development Order

1. 9.x — Final UI Look — Polish (activity-type icons, typography, remaining cosmetic refinement, pending the user's updated visual reference material)
2. 10.x — Shared Persistence & Accounts (backend architecture confirmed — see `docs/decisions/ADR-003-Backend-Architecture.md`; starting with 10.1)
3. 11.x+ — Extended travel functionality

The order remains intentional: the mobile experience was validated on a real device, the visual design is finished before committing to the larger architectural shift of introducing a server-side component, accounts and multi-device sync, and that shared-persistence foundation is in place before the future Extended Travel Companion modules are built on top of it.

---

## 7. Deferred Decisions / Future Work

### XLSX template

The current importer intentionally follows the existing RoadBook workbook structure and its current column names. The user is evolving the RoadBook workbook itself (e.g. standardizing the "Typ" column). A future version should define a stable, English-language import template so future RoadBooks can be prepared independently of the original workbook language.

This is **not** a blocker for the current BlizzCon RoadBook.

### UI / UX

The `appka_navrh_look.png` redesign's structural/functional pass is complete, including the permanent bottom navigation placement and comprehensive component-level dark-mode coverage. The remaining cosmetic finish (activity-type icons, typography, final polish) is tracked as Milestone 6.5 (9.x), pending the user's updated visual reference material, and is expected to be treated as binding guidance for future UI Features in the same way `docs/ux/UserJourney.md` has been.

### Backup / data safety

Since the application currently stores all Trip/itinerary data in browser `localStorage` only, Export/Import backup (7.2) remains an important safety net even after Milestone 7 (Shared Persistence & Accounts) is introduced, particularly for fully-offline usage.

### Shared persistence / accounts (Milestone 7 / 10.x)

Backend hosting approach confirmed: a self-hosted Node.js/Express API backed by SQLite, running on the user's own Linux server with a static public IP, fronted by Caddy (reverse proxy + automatic Let's Encrypt TLS) and a free DuckDNS dynamic-DNS hostname, run as a `pm2`-managed process. See `docs/decisions/ADR-003-Backend-Architecture.md` for the full decision record.

### Extended travel platform

Budget, checklist, currency, timeline, equipment, knowledge base and related modules remain later milestones (11.x+), expected to build on the shared persistence/accounts foundation.

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
