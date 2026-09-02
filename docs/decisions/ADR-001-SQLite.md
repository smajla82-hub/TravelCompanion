# ADR-001 — SQLite persistence

## Status

Superseded by [ADR-002-PWA-Architecture.md](./ADR-002-PWA-Architecture.md) — 2026-09-02

## Context

SQLite (with Drizzle ORM) was originally listed in the root README's tech-stack table as the intended persistence layer, alongside a native desktop/mobile packaging plan (Tauri/Capacitor).

## Decision

SQLite is **not** adopted. The project committed to a PWA architecture (ADR-002), which runs in the browser sandbox and does not have access to a native SQLite runtime without a native shell — which was also rejected.

Persistence continues to use browser-native storage:

- **Now:** `localStorage`, as implemented in `TripService.ts` (whole Trip list, including nested itinerary, serialized as JSON under a single key).
- **Future, if needed:** `IndexedDB`, if data volume, structured querying needs, or offline-sync requirements outgrow what `localStorage` can reasonably support. This is a deferred decision, not a current blocker.

## Consequences

- No ORM (Drizzle or otherwise) is required while persistence stays browser-native.
- Multi-device sync (PC ↔ mobile) is **not** solved by this decision. If/when that becomes a requirement, a follow-up ADR should evaluate options (e.g. a lightweight backend/sync service, file-based export/import, or a cloud-sync provider) rather than reopening the native/SQLite path.
