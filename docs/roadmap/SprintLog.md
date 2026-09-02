# Travel Companion — Sprint Log

This file records the completed development history of the Travel Companion application.

It is a human-readable history, not an archive of every Git commit. Git remains authoritative for exact commit history.

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
Fixed itinerary changes requiring a manual page refresh by rewriting the TripService itinerary mutations to an immutable update pattern, and replaced the four inline per-activity buttons with a single compact Manage action opening an itinerary item actions modal.

### 6.0.15
**Status:** DONE
Redesigned the itinerary day view: added real-time current/next activity highlighting (comparing each timed activity against the device clock, only for the day matching today's date), per-activity Food and Parking buttons opening focused modals (Food shows the day's recommended venues; Parking shows the matching `ParkingLocation` or a best-effort fallback from the activity's own fields), and a single day-level Statistics button next to the day heading. The full scrollable activity list and the existing Manage button/`ItineraryItemActionsModal` (Edit/Delete/Move up/Move down) are unchanged. Extracted `RecommendedVenueList` and `DayStatsList` subcomponents shared between the day detail view and the existing "Recommended venues & parking" fallback panel, which no longer duplicates the Statistics section.

### 6.0.16
**Status:** DONE
Meal-type-aware Food venue filtering, `mealType` and `subtype` fields on recommended venues, and updated venue-list rendering. Itinerary day details now close automatically when the Active Trip changes, and the Continue Trip button scrolls to the itinerary section.

---

# Current Position

**Current Milestone:** 6.x — Data Import & Itinerary  
**Completed through:** 6.0.16
**Status:** DONE through 6.0.16

Next:

## 7.x — BlizzCon Ready

## 8.x — Android / Mobile

## 9.x+ — Extended Travel Companion

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

---

# Deferred Work

The current XLSX importer follows the existing RoadBook workbook's column names.

A future standardized English import template should be introduced when the import format is generalized for future trips. This is intentionally deferred and does not block the current BlizzCon workflow.

Final mobile/responsive polish and extended travel modules remain future work.

---

# Documentation Rule

Update the Sprint Log after a major Feature is completed.

Do not add an entry for every small implementation step unless it is important enough to explain the project's history.

Roadmap describes direction; SprintLog records meaningful completed work; Handoff captures the current continuity state.
