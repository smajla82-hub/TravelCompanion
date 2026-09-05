# Travel Companion — Sprint Log

This file records the completed development history of the Travel Companion application.

It is a human-readable history, not an archive of every Git commit. Git remains authoritative for exact commit history.

## Sprint 7.5.x
**Status:** DONE
Implemented the `appka_navrh_look.png` visual redesign: centralized color, typography, radius and shadow tokens; consolidated button styling; destination-aware flags; redesigned dashboard, active trip and itinerary presentation.

## Feature 7.5.2
**Status:** DONE
Refined the centered dashboard header, removed redundant controls and the Current Trip heading, and balanced the Active Trip card with a refined decorative graphic, larger status badge and bottom-centered Continue Trip button.

### 7.5.3
**Status:** DONE
Fixed a `Stack` component CSS class-name mismatch that silently disabled its flex layout, which was the root cause of the Active Trip card's broken internal spacing; the card now uses an explicit flex column so the Continue Trip button reliably sits at the bottom.

### 7.5.4
**Status:** DONE
Moved the Food/Parking/Statistics action stack inside unified Current Activity and Next Activity cards, refined the Active Trip gradient card decoration with a subtle CSS mountain silhouette, and reconciled design tokens/spacing against the corrected `docs/ux/UserJourney.md`.

### 8.1
**Status:** DONE

Added PWA installation support and a GitHub Pages deployment workflow:

- `vite-plugin-pwa` generates the `manifest.webmanifest` and Workbox service worker. The worker precaches only the static app shell (HTML, JavaScript, CSS and icons); it does not add runtime caching or interception for external navigation (Google Maps smart-chip links continue to work unchanged).
- Branded blue (`#2563eb`) and purple (`#8b5cf6`) placeholder PNG icons were added in 192×192, 512×512 and Apple touch 180×180 dimensions. To replace them later, provide a square 512×512 PNG (transparent or solid background) and the icon set can be regenerated.
- The mobile audit corrected the viewport and theme-color metadata, added top/bottom safe-area insets to the dashboard header and fixed bottom navigation, and ensured compact, action-stack and nav touch targets meet a ~44×44px minimum.
- `.github/workflows/deploy-pages.yml` builds the `app/` directory with pnpm and deploys it to GitHub Pages. One repository-owner setup step was required: enabling Pages with **Source: GitHub Actions** in repository settings, which the user has since completed.

**Real-device verification (post-merge):** the user tested the installed PWA end-to-end on a real Android device, across two environments — the local dev server (`http://localhost:5173/`) and the deployed GitHub Pages build (`https://smajla82-hub.github.io/TravelCompanion/`). Coverage included creating new Trips (BlizzCon, Test), Active Trip switching, itinerary browsing, Food/Parking/Statistics modals, Dark/Light mode and Export/Import — no issues were found. This confirms Milestone 6 (Mobile/Android) as functionally solid on real hardware, not just in desktop-browser emulation.

A new **mobile-verification rule** was added to `docs/roadmap/Roadmap.md`'s Development Model: future UI/UX-affecting changes must be verified on desktop first, then re-verified on a real mobile device via the GitHub Pages deployment before being considered DONE.

---

## Initial Project Structure

- `docs: initial project structure`
- `Create project structure`
- `docs: finalize architecture and workflows`

These commits established the initial repository/documentation structure before the React application development sequence.

---

# 3.x — Foundation

## Sprint 3.0
**Status:** DONE
Bootstrap React application.

## Sprint 3.1
**Status:** DONE
First own React application.

## Sprint 3.2
**Status:** DONE
First own React application.

## Sprint 3.3.1
**Status:** DONE
Index creation.

## Sprint 3.3.3
**Status:** DONE
Button component.

## Sprint 3.3
**Status:** DONE
First functional dashboard.

## Sprint 3.4.3
**Status:** DONE
Grid component.

## Sprint 3.4.5
**Status:** DONE
Transition to UI Barrel.

## Sprint 3.5
**Status:** DONE
Dashboard Foundation.

## Sprint 3.6
**Status:** DONE
Design System Foundation.

## Sprint 3.7
**Status:** DONE
Trip Management Foundation.

## Sprint 3.8
**Status:** DONE
First Feature.

## Sprint 3.9
**Status:** DONE
My Trips.

---

# 4.x — Architecture & UI

## Sprint 4.0
**Status:** DONE
Feature Architecture.

## Sprint 4.1
**Status:** DONE
UI Library v2.

## Sprint 4.2
**Status:** DONE
Domain Layer.

## Sprint 4.3A
**Status:** DONE
Dashboard Refactoring.

## Sprint 4.5
**Status:** DONE
Active Trip selection.

## Sprint 4.7.1
**Status:** DONE
Creation of the Modal component.

## Sprint 4.7B
**Status:** DONE
Modal usage.

## Sprint 4.8.1
**Status:** DONE
Modal improvements / structure.

## Sprint 4.8.2
**Status:** DONE
Modal animations.

---

# 5.x — Trip Management

## Sprint 5.0
**Status:** DONE
Trip Management.

## Sprint 5.1.3
**Status:** DONE
Modal connection.

## Feature 5.2
**Status:** DONE
Creating Trips.

Completed through the recorded sub-steps 5.2.4–5.2.7.

## Feature 5.3
**Status:** DONE
Form Validation.

Completed:
- 5.3.1
- 5.3.2
- 5.3.3
- 5.3.4

Verified behavior included validation, form reset and creation of multiple Trips.

## Feature 5.4A
**Status:** DONE
Form Hotfix.

## Feature 5.5
**Status:** DONE
Edit Existing Trip.

## Feature 5.6
**Status:** DONE
Edit Existing Trip.

## Feature 5.7.5–5.7.8
**Status:** DONE
Stabilization of Trip state.

Verified:
- Trip deletion
- removal of a deleted Trip from the active Trip display
- creation of new Trips
- editing Trips
- deleting Trips
- Trip detail interaction
- stabilization of active Trip state

## Feature 5.8
**Status:** DONE
Active Trip Management.

The application gained explicit Active Trip behavior and the dashboard/itinerary flow was moved toward the selected Active Trip.

## Feature 5.9
**Status:** DONE
Persistence.

Trip state and related changes were verified across application refreshes. Persistence became the basis for the subsequent RoadBook import work.

---

# 6.x — Data Import & Itinerary

## Feature 6.0
**Status:** DONE through 6.0.11
RoadBook / XLSX import and itinerary integration.

### 6.0.1–6.0.5
**Status:** DONE
Established the RoadBook import foundation and mapping of XLSX data into the application domain.

### 6.0.6–6.0.8
**Status:** DONE
Implemented XLSX parsing, import UI and RoadBook preview.

Verified import of the current RoadBook workbook.

### 6.0.9
**Status:** DONE
RoadBook persistence.

The imported RoadBook can be assigned to a selected Trip and stored in that Trip's itinerary.

Persistence was verified by changing Active Trips and refreshing the application.

### 6.0.10
**Status:** DONE
Active Trip itinerary integration.

The itinerary shown by the dashboard is now derived from the Active Trip rather than from the previous global/demo itinerary.

### 6.0.11
**Status:** DONE
Itinerary day cards and day-detail interaction.

Implemented:

- day-level itinerary cards
- day metadata display
- activity count per day
- opening a selected day's detail
- displaying the activities belonging to that day
- closing the detail view and returning to the day list

A previous issue where the day title inherited the first activity title was corrected so the actual day title is displayed.

Current verified RoadBook test data:

**8 days · 150 activities**

### 6.0.12
**Status:** DONE
Imported recommended venues and flexible day statistics from RoadBook worksheets, with both sections available behind a collapsed per-day details control in the import preview and saved itinerary.

### 6.0.13
**Status:** DONE
Stopped recommended venues from being duplicated into the main timeline and preserved Google Maps links from timeline, venue and parking smart-chip cells.

### 6.0.14
**Status:** DONE
Added in-app itinerary activity creation, editing, deletion and reordering with immediate localStorage persistence.

### 6.0.14.1
**Status:** DONE
Fixed itinerary changes requiring a manual page refresh by rewriting the TripService itinerary mutations to an immutable update pattern, and replaced the four inline per-activity buttons with a single consolidated "Manage" action.

### 6.0.15
**Status:** DONE
Redesigned the itinerary day view: added real-time current/next activity highlighting (comparing each timed activity against the device clock, only for the day matching today's date), per-activity Food/Parking buttons and a day-level Statistics button.

### 6.0.16
**Status:** DONE
Meal-type-aware Food venue filtering, `mealType` and `subtype` fields on recommended venues, and updated venue-list rendering. Itinerary day details now close automatically when the Active Trip changes.

### 7.1
**Status:** DONE
The dashboard now opens on the Active Trip's current and next activity, with a "View whole Itinerary" entry point for the existing day-list and day-detail flow. Trips outside their date range show a start/end edge-case message.

### 7.2
**Status:** DONE
Added a dedicated `/settings` page for app-wide settings and data safety features. Import RoadBook was moved from the dashboard into Settings, while keeping the existing XLSX import component unchanged. Added JSON Export/Import backup with overwrite confirmation.

### 8.1
**Status:** DONE

Added PWA installation support and a GitHub Pages deployment workflow:

- `vite-plugin-pwa` generates the `manifest.webmanifest` and Workbox service worker. The worker precaches only the static app shell (HTML, JavaScript, CSS and icons); it does not add runtime caching or interception for external navigation (Google Maps smart-chip links continue to work unchanged).
- Branded blue (`#2563eb`) and purple (`#8b5cf6`) placeholder PNG icons were added in 192×192, 512×512 and Apple touch 180×180 dimensions. To replace them later, provide a square 512×512 PNG (transparent or solid background) and the icon set can be regenerated.
- The mobile audit corrected the viewport and theme-color metadata, added top/bottom safe-area insets to the dashboard header and fixed bottom navigation, and ensured compact, action-stack and nav touch targets meet a ~44×44px minimum.
- `.github/workflows/deploy-pages.yml` builds the `app/` directory with pnpm and deploys it to GitHub Pages. One repository-owner setup step was required: enabling Pages with **Source: GitHub Actions** in repository settings, which the user has since completed.

**Real-device verification (post-merge):** the user tested the installed PWA end-to-end on a real Android device, across two environments — the local dev server (`http://localhost:5173/`) and the deployed GitHub Pages build (`https://smajla82-hub.github.io/TravelCompanion/`). Coverage included creating new Trips (BlizzCon, Test), Active Trip switching, itinerary browsing, Food/Parking/Statistics modals, Dark/Light mode and Export/Import — no issues were found. This confirms Milestone 6 (Mobile/Android) as functionally solid on real hardware, not just in desktop-browser emulation.

After deployment, open `https://smajla82-hub.github.io/TravelCompanion/` in Chrome on Android and use the browser menu's **Add to Home screen** / **Install app** option to verify installation.

---

# 9.x — Final UI Look

## 9.1
**Status:** DONE  
Established the inline SVG icon system across navigation and actions, replacing inconsistent icon treatments.

## 9.2
**Status:** DONE  
Introduced the canonical Activity Type registry and semantic icons, shared by persisted itinerary data, the XLSX importer and the UI.

## 9.3
**Status:** DONE  
Integrated Activity Type into itinerary creation, editing and display, while retaining legacy `goal` data only for backward compatibility.

## 9.4
**Status:** DONE  
Unified Current Activity, Next Activity and itinerary rows around `ActivitySummary`; polished Whole Itinerary and the Add Day flow.

## 9.5
**Status:** DONE  
Applied semantic Priority/Parking colors, refined spacing, and added recommended-venue dividers.

## 9.6
**Status:** DONE  
Added shared text/data limits, importer validation and warnings, and overflow handling without truncating already stored data.

## 9.7 / 9.7B
**Status:** DONE  
Completed the approved Dashboard visual redesign: mobile is authoritative, with bundled raster artwork in the top header, hero and bottom navigation.

## 9.8A
**Status:** DONE  
Current Activity's “Show more” now opens the active day's remaining-activities view, while Whole Itinerary remains complete history.

## 9.8B
**Status:** DONE — no code changes required  
Completed the visual consistency review against the approved 9.7B baseline.

## 9.8C
**Status:** SKIPPED / USER VERIFIED

## 9.8D
**Status:** SKIPPED / USER VERIFIED

---

# Current Position

**Current Milestone:** 9.x — Final UI Look
**Completed through:** 9.8B
**Status:** 9.8E / My Trips visual polish and 9.8F / Settings visual polish remain planned before 10.x.

Next:

## 9.8E — My Trips visual polish (PLANNED)

## 9.8F — Settings visual polish (PLANNED)

## 9.8G — Final responsive / QA pass (PLANNED)

## 10.x — Shared Persistence & Accounts (PLANNED)

Introduce user accounts and shared/synced Trip data across multiple devices, replacing the current browser-`localStorage`-only persistence model. The user's preferred backend direction is a self-hosted Node.js/Express (or Fastify) API with PostgreSQL/SQLite, running on their own Linux server with a static public IP, paired with a free dynamic-DNS hostname (e.g. DuckDNS) and a free TLS certificate (e.g. Let's Encrypt) to satisfy the GitHub-Pages-hosted frontend's HTTPS requirement. See `docs/roadmap/Roadmap.md` section 3 (Milestone 7) for the proposed sub-feature breakdown (10.1–10.6); a formal architecture decision record in `docs/decisions/` is still pending final confirmation.

## 11.x+ — Extended Travel Companion (PLANNED)

Budget, checklist, currency, timeline, equipment, knowledge base and related modules — expected to build on top of the shared persistence/accounts foundation once it exists.

---

# Important Architectural State

The current itinerary architecture is:

```text
Trip
 └── itinerary
      └── ItineraryDay[]
           └── items: ItineraryItem[]
```

The dashboard itinerary flow is:

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
ItineraryDayCard / ItineraryDayDetail
```

The RoadBook flow is:

```text
XLSX
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
```

All Trip/itinerary data is currently persisted exclusively in browser `localStorage`, with no server-side component. This is the state that Milestone 7 (10.x — Shared Persistence & Accounts) will change.

---

# Deferred Work

The current XLSX importer follows the existing RoadBook workbook's column names.

A future standardized English import template should be introduced when the import format is generalized for future trips. This is intentionally deferred and does not block the current BlizzCon work.

My Trips and Settings visual polish, an optional final responsive/QA pass, and the shared persistence/accounts architecture (Milestone 7 / 10.x) remain the next planned areas of work.

---

# Documentation Rule

Update the Sprint Log after a major Feature is completed.

Do not add an entry for every small implementation step unless it is important enough to explain the project's history.

Roadmap describes direction; SprintLog records meaningful completed work; Handoff captures the current continuity state.
