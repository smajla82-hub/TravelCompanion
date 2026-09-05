# Travel Companion Backend API

This directory contains the self-hosted backend foundation for Milestone 7 / Feature 10.1.

## Architecture choice

The backend uses:

- Node.js + Express for the HTTP API
- SQLite with `better-sqlite3` for the database layer
- A thin repository layer to keep DB access isolated from route handlers

This choice matches the existing project decision in `docs/decisions/ADR-003-Backend-Architecture.md`: small self-hosted deployment, low operational overhead, and a single SQLite file on the user's server.

## Local development

1. Ensure Node.js 18+ is installed.
2. In this directory, install dependencies:

   npm install

3. Copy the example environment file:

   cp .env.example .env

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

## API surface

The API intentionally mirrors the current Trip/itinerary domain model without coupling the frontend to it yet.

### Trip endpoints

- `GET /trips` — list trips
- `POST /trips` — create trip
- `GET /trips/:id` — fetch trip by ID
- `PUT /trips/:id` — update trip
- `DELETE /trips/:id` — delete trip
- `GET /trips/active` — fetch active trip
- `PUT /trips/:id/active` — set the active trip

### Itinerary endpoints

- `GET /trips/:tripId/itinerary` — list trip itinerary days with nested items
- `POST /trips/:tripId/itinerary/days` — add an itinerary day
- `GET /trips/:tripId/itinerary/days/:dayId` — fetch day + items
- `PUT /trips/:tripId/itinerary/days/:dayId` — update day
- `DELETE /trips/:tripId/itinerary/days/:dayId` — delete day
- `GET /trips/:tripId/itinerary/days/:dayId/items` — list items for a day
- `POST /trips/:tripId/itinerary/days/:dayId/items` — add itinerary item
- `PUT /trips/:tripId/itinerary/days/:dayId/items/:itemId` — update item
- `DELETE /trips/:tripId/itinerary/days/:dayId/items/:itemId` — delete item

### Python- or shell-friendly example

```bash
curl -X POST http://localhost:3001/trips \
  -H 'Content-Type: application/json' \
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

- `trips`
- `itinerary_days`
- `itinerary_items`
- active-trip state via `trips.is_active`

This is intentionally a minimal first schema for the backend foundation; future features such as authentication and sharing will extend it without a rewrite of the existing route structure.

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
