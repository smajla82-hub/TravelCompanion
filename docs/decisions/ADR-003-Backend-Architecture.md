# ADR-003 — Self-hosted backend architecture for Shared Persistence & Accounts

## Status

Accepted — 2026-09-03

## Context

Travel Companion currently persists all Trip/itinerary data exclusively in browser `localStorage` (see `docs/decisions/ADR-001-SQLite.md`), which is device-local by definition — data does not sync between the user's PC and their Android phone, and there is no concept of a user account or of a Trip shared between multiple travelers.

Milestone 7 (Shared Persistence & Accounts, `10.x` in `docs/roadmap/Roadmap.md`) requires introducing:
- user accounts (login),
- Trip data stored centrally rather than per-device,
- the ability for a Trip to be shared/visible across multiple accounts (co-travelers),
- reasonable behavior for offline edits made on multiple devices before they can sync.

The frontend is a static site deployed to **GitHub Pages** (`docs/decisions/ADR-002-PWA-Architecture.md`), which only serves static files — it cannot host a database or server-side logic itself. A separate backend component is required.

Three broad approaches were considered:

1. **Backend-as-a-Service** (e.g. Supabase, Firebase) — fastest to stand up, handles auth/database/realtime sync out of the box, but couples the application to a third-party external service and its pricing/availability.
2. **Self-hosted backend** — a custom API server running on infrastructure the user directly controls.
3. **GitHub-as-backend** — using the GitHub API itself (e.g. committing/reading JSON files in a private repo) as a lightweight ad-hoc data store, avoiding a new service but poorly suited to this use case (rate limits, not designed for this purpose, awkward multi-user semantics).

The user already operates a Linux server with a static public IP address and the `pm2` process manager already installed and in use on that server, and explicitly prefers not to couple the application to an external third-party service. No domain name is registered for that server.

## Decision

Travel Companion's Shared Persistence & Accounts backend (Milestone 7 / `10.x`) will be a **self-hosted backend** (Option 2), with the following concrete architecture:

- **API server:** a Node.js/Express (or Fastify — final choice confirmed during `10.1` implementation) HTTP API, exposing REST endpoints for Trip CRUD, itinerary CRUD, Active Trip selection, authentication and Trip-sharing, replacing direct `localStorage` reads/writes on the frontend.
- **Database:** SQLite, accessed through a lightweight query layer/ORM (exact library choice confirmed during `10.1`). This supersedes the "not adopted" SQLite conclusion in `docs/decisions/ADR-001-SQLite.md` for a fundamentally different reason: ADR-001 rejected SQLite as an *in-browser/native-app* persistence layer for a PWA running in a browser sandbox; this decision adopts SQLite as the *server-side* database for a conventional backend API process, which is an entirely different runtime context and does not conflict with the PWA architecture in `ADR-002`. SQLite is judged sufficient given the expected scale (a small number of users/travelers sharing a handful of Trips), avoiding the operational overhead of a separate database server (e.g. PostgreSQL).
- **Process management:** the API process runs under the user's existing `pm2` installation on their Linux server, giving automatic restart-on-crash and restart-on-reboot without introducing new server-management tooling.
- **Public reachability & TLS:** the server has a static public IP but no registered domain name. A free dynamic-DNS hostname will be provisioned via **DuckDNS**, pointed at that static IP. **Caddy** will run as a reverse proxy in front of the Node.js API, using the DuckDNS hostname to automatically obtain and renew a **Let's Encrypt** TLS certificate. This is required because the frontend is served over HTTPS from GitHub Pages, and browsers block "mixed content" — an HTTPS page cannot call a plain HTTP API. Caddy was chosen over a manually configured nginx + certbot setup for its comparatively minimal, low-maintenance configuration.
- **Network:** the user's server/router must have ports 80 and 443 open/forwarded to the machine running Caddy, for HTTP-01 Let's Encrypt certificate issuance/renewal and for HTTPS API traffic respectively.

## Consequences

- A new operational responsibility is introduced that did not exist for the GitHub-Pages-only frontend: the user is now responsible for the uptime, updates, and backups of their own server, database file and reverse proxy — this should be documented as a runbook under Feature `10.6` once the backend exists.
- `docs/decisions/ADR-001-SQLite.md` remains valid as written (SQLite rejected as an in-browser/native persistence layer for the PWA itself); this ADR does not reverse that decision, it adopts SQLite in a different role (server-side database for the new backend API), which should be clarified via a cross-reference rather than treating ADR-001 as further superseded.
- No third-party Backend-as-a-Service (Supabase/Firebase) or GitHub-API-based storage scheme will be adopted for this purpose, per the user's explicit preference to avoid external-service coupling.
- The exact conflict-resolution strategy for concurrent/offline multi-device edits (Feature `10.4`), the Trip-sharing model (Feature `10.3`), and the specific Node.js framework/ORM choice (Feature `10.1`) remain open implementation details to be finalized when those features are scoped and built — this ADR fixes the *hosting/infrastructure* architecture, not the full API/data-model design.
- The frontend's existing fully-offline `localStorage`-first behavior must be preserved after this backend is introduced; sync to the backend is expected to be opportunistic (when connectivity is available) rather than a hard requirement for basic app usage, consistent with `ADR-002-PWA-Architecture.md`.

## Related

- `docs/decisions/ADR-001-SQLite.md`
- `docs/decisions/ADR-002-PWA-Architecture.md`
- `docs/roadmap/Roadmap.md` — Milestone 7 (Shared Persistence & Accounts, `10.x`)
