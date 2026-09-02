# ADR-002 — PWA as the target platform

## Status

Accepted — 2026-09-02

## Context

The project originally listed a broader native-oriented stack in the root `README.md` (Tauri for desktop, Capacitor for mobile, SQLite + Drizzle ORM for persistence, Zustand for state). None of this stack was ever implemented; the actual `app/` codebase has always been a plain Vite + React + TypeScript web application using `localStorage` for persistence.

The practical goal of Travel Companion is to let a user prepare a trip plan on a PC (from a RoadBook/XLSX template) and then open a compact, itinerary-first view of that same trip on a phone, ideally installable like an app, without requiring app-store distribution or a native build pipeline.

## Decision

Travel Companion targets a **Progressive Web App (PWA)** as its primary and only planned platform target:

- No native desktop shell (Tauri/Electron) is planned.
- No native mobile shell (Capacitor) is planned.
- The application is a responsive, installable web app (manifest + service worker) that runs identically on desktop and mobile browsers.
- Offline support is achieved through a service worker (asset/app-shell caching) plus the existing browser-based data persistence, not through a native runtime.

## Consequences

- `docs/decisions/ADR-001-SQLite.md` is superseded by this decision — see that file for the explicit persistence follow-up.
- Zustand, Drizzle ORM, Tauri and Capacitor are removed from the tech stack until (if ever) a concrete requirement reintroduces them.
- Mobile/Android readiness (Milestone 8.x in `Roadmap.md`) is achieved through PWA installability and responsive/touch UI polish, not through a native packaging step.
- A lightweight in-app state solution (React state/hooks, or a minimal store) is preferred over adopting a full state-management library, unless a concrete complexity problem justifies it.

## Related

- `docs/decisions/ADR-001-SQLite.md`
- `docs/roadmap/Roadmap.md` — Milestone "UI/Mobile Polish & PWA"
