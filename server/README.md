# Travel Companion Backend API

This directory contains the self-hosted backend foundation for Milestone 7 / Features 10.1–10.3.

## Architecture choice

The backend uses:

- Node.js + Express for the HTTP API
- SQLite with `better-sqlite3` for the database layer
- A thin repository layer to keep DB access isolated from route handlers
- `bcryptjs` for password hashing (pure-JS, chosen so we don't need to manage a second native-module toolchain alongside `better-sqlite3`'s existing native bindings)
- `jsonwebtoken` for issuing/verifying JWTs used to authenticate API requests

This choice matches the existing project decision in `docs/decisions/ADR-003-Backend-Architecture.md`: small self-hosted deployment, low operational overhead, and a single SQLite file on the user's server.

## Local development

1. Ensure Node.js 18+ is installed.
2. In this directory, install dependencies:

   npm install

3. Copy the example environment file:

   cp .env.example .env

   Set `JWT_SECRET` to your own value locally too — see [Authentication](#authentication) below.

4. Start the API locally:

   npm start

5. Verify the health endpoint:

   curl http://localhost:3001/health

Expected response:

```json
{
  "status": "ok",
  "service": "travel-companion-api",
  "timestamp": "2026-09-05T00:00:00.000Z"
}
```

## Authentication

Feature 10.2 adds simple email + password accounts, backend-only (the frontend `app/` is not wired up to it yet and continues to use `localStorage`).

- Passwords are hashed with `bcryptjs` before being stored — plaintext passwords are never persisted. A minimum password length of 8 characters is enforced on registration.
- On successful register/login, the API issues a JSON Web Token (JWT) signed with the `JWT_SECRET` environment variable. Tokens expire after `JWT_EXPIRES_IN` (defaults to `7d`, i.e. 7 days).
- All `/trips` routes (including nested itinerary routes) require a valid JWT.
- `GET /health` remains public and unauthenticated (used by Caddy/infra monitoring).

### Auth endpoints

- `POST /auth/register` — body `{ "email": string, "password": string }`. Validates a basic email format and an 8+ character password, creates a user (email is stored lower-cased, unique case-insensitively), and returns `{ token, user }`. `user` never includes the password hash.
- `POST /auth/login` — body `{ "email": string, "password": string }`. Returns `{ token, user }` on success, `401` on invalid credentials.
- `GET /auth/me` — requires an `Authorization` header with the JWT in bearer-token format (`Authorization: bearer <token>`). Returns the current user's public profile (`id`, `email`, `createdAt`, `updatedAt`).

### Calling protected routes

```bash
curl http://localhost:3001/trips \
  -H "Authorization: bearer $TOKEN"
```

### `JWT_SECRET`

`JWT_SECRET` **must** be set to a long, random, unique value in production — never deploy with the `.env.example` placeholder. This follows the same pattern as `ALLOWED_CORS_ORIGIN`: the placeholder ships in `.env.example` for local development only, and the real production value is set manually by the user on their server (see the deployment runbook below). If `NODE_ENV=production` and `JWT_SECRET` is missing or still set to the development placeholder, the server refuses to start, so misconfiguration fails loudly instead of silently issuing forgeable tokens. There is no password reset / email verification flow in this initial version, and no OAuth/social login — both are explicitly out of scope for 10.2 per the roadmap.

### Rate limiting

`POST /auth/register` and `POST /auth/login` are rate-limited per IP (20 requests / 15 minutes) to reduce brute-force/credential-stuffing risk. `GET /auth/me` and all `/trips` routes use a more permissive general limiter, since they already require a valid JWT.

## API surface

The API intentionally mirrors the current Trip/itinerary domain model without coupling the frontend to it yet.

### Trip endpoints (require an `Authorization` header with a bearer-token JWT)

- `GET /trips` — list trips the caller owns or belongs to
- `POST /trips` — create trip (owned by the authenticated user)
- `GET /trips/:id` — fetch a trip visible to the caller
- `PUT /trips/:id` — update a trip (Owner or Editor)
- `DELETE /trips/:id` — delete a trip (Owner only)
- `GET /trips/active` — fetch the authenticated user's active trip
- `PUT /trips/:id/active` — set the active trip

### Itinerary endpoints (require an `Authorization` header with a bearer-token JWT)

- `GET /trips/:tripId/itinerary` — list trip itinerary days with nested items
- `POST /trips/:tripId/itinerary/days` — add an itinerary day
- `GET /trips/:tripId/itinerary/days/:dayId` — fetch day + items
- `PUT /trips/:tripId/itinerary/days/:dayId` — update day
- `DELETE /trips/:tripId/itinerary/days/:dayId` — delete day
- `GET /trips/:tripId/itinerary/days/:dayId/items` — list items for a day
- `POST /trips/:tripId/itinerary/days/:dayId/items` — add itinerary item
- `PUT /trips/:tripId/itinerary/days/:dayId/items/:itemId` — update item
- `DELETE /trips/:tripId/itinerary/days/:dayId/items/:itemId` — delete item

### Shared access endpoints (require an `Authorization` header with a bearer-token JWT)

| Role | Read trip/itinerary | Edit trip/itinerary | Manage invitations/members | Delete trip |
| --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | Yes |
| Editor | Yes | Yes | No | No |
| Viewer | Yes | No | No | No |

A Trip has exactly one Owner: its original creator. Ownership transfer is not supported.

- `POST /trips/:tripId/invitations` — Owner only; body `{ "email": string, "role": "editor" | "viewer" }`. Returns the pending invitation and its token/accept link.
- `GET /trips/:tripId/invitations` — Owner only; list invitations, including completed/revoked/expired invitations.
- `DELETE /trips/:tripId/invitations/:invitationId` — Owner only; revoke a pending invitation.
- `POST /invitations/:token/accept` — authenticated recipient only; the authenticated email must match the invitation email. Adds the recipient as a member.
- `POST /invitations/:token/reject` — authenticated recipient only; marks the invitation rejected.
- `GET /trips/:tripId/members` — any member; list members with user ID, email and role.
- `PUT /trips/:tripId/members/:userId` — Owner only; body `{ "role": "editor" | "viewer" }`.
- `DELETE /trips/:tripId/members/:userId` — Owner only; remove a non-owner member.

Invitations expire after `INVITATION_EXPIRES_IN_DAYS` (default: `7`). Delivery by email, SMS, or any other service is deliberately out of scope: the API returns the token/accept link, which the Owner shares manually through WhatsApp or another messaging channel.

### Python- or shell-friendly example

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "you@example.com", "password": "your-password"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -X POST http://localhost:3001/trips \
  -H 'Content-Type: application/json' \
  -H "Authorization: bearer $TOKEN" \
  -d '{
    "name": "Weekend in Prague",
    "destination": "Prague",
    "country": "Czech Republic",
    "startDate": "2026-10-01",
    "endDate": "2026-10-03",
    "travellers": 2,
    "status": "planning"
  }'
```

## SQLite schema and init

On startup, the app creates the SQLite database file at the configured `DB_PATH` and executes `src/db/schema.sql` if required.

The initial schema covers:

- `users` — accounts (email unique, case-insensitive; password stored only as a bcrypt hash)
- `trips` — now includes a nullable `user_id` foreign key linking a trip to its owning account
- `trip_members` — one Owner membership for each Trip plus optional Editor/Viewer memberships
- `invitations` — email-bound, expiring invitation tokens and their status
- `itinerary_days`
- `itinerary_items`
- active-trip state via `trips.is_active`

Since `trips` existed before Feature 10.2, `src/db/db.js` also runs a small idempotent migration on every startup: if the `trips` table doesn't yet have a `user_id` column (i.e. a database created under 10.1), it adds the column via `ALTER TABLE` and creates its index. It also backfills an Owner `trip_members` row for every existing Trip whose `user_id` is set.

This is intentionally a minimal schema evolution for the backend foundation; future features such as shared Trip access (10.3) will extend it further without a rewrite of the existing route structure.

## Deployment runbook (for the user's own Linux server)

The following steps are intentionally exact and documented so a non-agent human can follow them on a separate physical server. The agent cannot perform them here because it has no access to the user's router, DNS account, or real server.

### Required prerequisites already on the server

The user must already have:

- Linux server with static public IP
- Node.js 18+
- `pm2` installed globally
- A DuckDNS hostname registered and resolving to the server's static IP
- Router/firewall configured to forward ports 80 and 443 to the server running Caddy

Manual steps still required before this is fully deployed:

- Register the actual DuckDNS hostname
- Confirm the hostname resolves to the server's public IP
- Open ports 80 and 443 on the router/firewall
- Copy the code to the server and run the install/start commands below
- Start Caddy and `pm2` on the actual server to obtain the real Let's Encrypt certificate

### 1. Copy the project to the server

```bash
scp -r ./server user@YOUR_SERVER_IP:/home/user/TravelCompanion/server
```

Then place the repository or at least the `server/` folder on the same host where `pm2` and Node.js are installed.

### 2. Install dependencies

```bash
cd /home/user/TravelCompanion/server
npm install
cp .env.example .env
```

Edit `.env` and set your values, for example:

```env
PORT=3001
DB_PATH=./data/travel-companion.db
ALLOWED_CORS_ORIGIN=https://smajla82-hub.github.io
NODE_ENV=production
```

### 3. Start with pm2

Update `server/deploy/ecosystem.config.cjs` to match the real path on the server, then run:

```bash
cd /home/user/TravelCompanion/server
pm2 start deploy/ecosystem.config.cjs
pm2 status
```

Useful commands:

```bash
pm2 restart travel-companion-api
pm2 logs travel-companion-api
pm2 stop travel-companion-api
```

### 4. Configure Caddy

Install Caddy on the server if it is not already installed, then replace the placeholder hostname in `server/deploy/Caddyfile`:

```caddy
your-subdomain.duckdns.org {
  reverse_proxy localhost:3001
}
```

with the actual DuckDNS hostname, for example:

```caddy
travel-companion.duckdns.org {
  reverse_proxy localhost:3001
}
```

Then copy the file to Caddy's config location (common path: `/etc/caddy/Caddyfile`) and reload Caddy:

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

### 5. Verify over HTTPS

Once the hostname resolves correctly and the Caddy certificate is issued, verify:

```bash
curl -k https://your-subdomain.duckdns.org/health
```

or, if you trust the cert and have valid DNS,:

```bash
curl https://your-subdomain.duckdns.org/health
```

Expected response:

```json
{"status":"ok","service":"travel-companion-api"}
```

### 6. Troubleshooting

- Port conflict: the API listens on `PORT` from `.env`; if another process already uses the port, stop it or change the port.
- Let's Encrypt failure: confirm port 80/443 are open and the DuckDNS hostname resolves to the server's public IP.
- Caddy config issue: check logs with `sudo journalctl -u caddy -f` or `caddy run --config /etc/caddy/Caddyfile` for a focused local test.
- `pm2` issues: inspect `pm2 logs travel-companion-api` and validate the DB file path and `PORT` in `.env`.

## Manual server-side steps remaining out of scope for this PR

These steps are intentionally not performed by the agent in this repository because the agent has no access to the user's physical server, router, or DNS provider:

- registering the actual DuckDNS hostname
- confirming the hostname resolves to the server's static public IP
- opening and forwarding ports 80 and 443 on the user's router/firewall
- copying the code to the real server and running the install/start commands
- starting Caddy and `pm2` on the actual server
- obtaining/renewing the real Let's Encrypt certificate in production
- managing any real production secrets beyond the placeholder `.env.example`

This repository only provides the ready-to-use scaffold and deployment instructions needed for that manual production setup.
