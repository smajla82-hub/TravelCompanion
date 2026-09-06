import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'travel-api-'));
process.env.DB_PATH = path.join(tempDir, 'travel-companion-test.db');
process.env.ALLOWED_CORS_ORIGIN = 'http://localhost:5173';
process.env.PORT = '0';

const { createApp } = await import(`../src/app.js?test=${Date.now()}`);

function startServer() {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

test('health endpoint returns ok', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.status, 'ok');
    assert.equal(payload.service, 'travel-companion-api');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('register creates a user and returns a token', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'Alice@Example.com', password: 'super-secret-1' }),
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.ok(payload.token);
    assert.equal(payload.user.email, 'alice@example.com');
    assert.equal(payload.user.passwordHash, undefined);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('register rejects duplicate emails', async () => {
  const { server, port } = await startServer();
  try {
    const body = JSON.stringify({ email: 'bob@example.com', password: 'super-secret-1' });
    const first = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    assert.equal(first.status, 201);

    const second = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    assert.equal(second.status, 409);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('register rejects passwords shorter than the minimum length', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'short@example.com', password: 'short1' }),
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('register rejects malformed email addresses', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'super-secret-1' }),
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('register handles concurrent duplicate registrations with a clean 409', async () => {
  const { server, port } = await startServer();
  try {
    const body = JSON.stringify({ email: 'race@example.com', password: 'super-secret-1' });
    const [first, second] = await Promise.all([
      fetch(`http://127.0.0.1:${port}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      fetch(`http://127.0.0.1:${port}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
    ]);
    const statuses = [first.status, second.status].sort();
    assert.deepEqual(statuses, [201, 409]);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('login succeeds with correct credentials and fails with wrong password', async () => {
  const { server, port } = await startServer();
  try {
    await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'carol@example.com', password: 'correct-horse' }),
    });

    const okResponse = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'carol@example.com', password: 'correct-horse' }),
    });
    assert.equal(okResponse.status, 200);
    const okPayload = await okResponse.json();
    assert.ok(okPayload.token);

    const badResponse = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'carol@example.com', password: 'wrong-password' }),
    });
    assert.equal(badResponse.status, 401);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('GET /auth/me requires and returns the authenticated user', async () => {
  const { server, port } = await startServer();
  try {
    const registerResponse = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dave@example.com', password: 'correct-horse' }),
    });
    const { token } = await registerResponse.json();

    const unauthenticated = await fetch(`http://127.0.0.1:${port}/auth/me`);
    assert.equal(unauthenticated.status, 401);

    const authenticated = await fetch(`http://127.0.0.1:${port}/auth/me`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    assert.equal(authenticated.status, 200);
    const me = await authenticated.json();
    assert.equal(me.email, 'dave@example.com');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('trips routes require authentication', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/trips`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('Trip CRUD flow works for an authenticated user', async () => {
  const { server, port } = await startServer();
  try {
    const registerResponse = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'erin@example.com', password: 'super-secret-1' }),
    });
    const { token } = await registerResponse.json();
    const authHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

    const createResponse = await fetch(`http://127.0.0.1:${port}/trips`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Weekend in Prague',
        destination: 'Prague',
        country: 'Czech Republic',
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        travellers: 2,
        status: 'planning',
      }),
    });

    assert.equal(createResponse.status, 201);
    const createdTrip = await createResponse.json();
    assert.ok(createdTrip.id);

    const listResponse = await fetch(`http://127.0.0.1:${port}/trips`, { headers: authHeaders });
    assert.equal(listResponse.status, 200);
    const tripList = await listResponse.json();
    assert.equal(tripList.length, 1);

    const activeResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/active`, {
      method: 'PUT',
      headers: authHeaders,
    });
    assert.equal(activeResponse.status, 200);
    const activeTrip = await activeResponse.json();
    assert.equal(activeTrip.id, createdTrip.id);
    assert.equal(activeTrip.isActive, true);

    const itineraryResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/itinerary/days`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ date: '2026-10-01', title: 'Arrival day' }),
    });
    assert.equal(itineraryResponse.status, 201);
    const day = await itineraryResponse.json();

    const itemResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/itinerary/days/${day.id}/items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        date: '2026-10-01',
        time: '09:30',
        title: 'Check-in',
        activityType: 'other',
      }),
    });
    assert.equal(itemResponse.status, 201);
    const item = await itemResponse.json();
    assert.equal(item.title, 'Check-in');

    const detailResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/itinerary/days/${day.id}`, {
      headers: authHeaders,
    });
    assert.equal(detailResponse.status, 200);
    const detail = await detailResponse.json();
    assert.ok(Array.isArray(detail.items));
    assert.equal(detail.items[0].id, item.id);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('a user cannot access another user\'s trip, and only sees their own trips', async () => {
  const { server, port } = await startServer();
  try {
    const registerUser = async (email) => {
      const response = await fetch(`http://127.0.0.1:${port}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'super-secret-1' }),
      });
      const { token } = await response.json();
      return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
    };

    const ownerHeaders = await registerUser('owner@example.com');
    const strangerHeaders = await registerUser('stranger@example.com');

    const createResponse = await fetch(`http://127.0.0.1:${port}/trips`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: 'Owner-only Trip',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
      }),
    });
    assert.equal(createResponse.status, 201);
    const ownerTrip = await createResponse.json();

    const strangerGetResponse = await fetch(`http://127.0.0.1:${port}/trips/${ownerTrip.id}`, {
      headers: strangerHeaders,
    });
    assert.equal(strangerGetResponse.status, 404);

    const strangerListResponse = await fetch(`http://127.0.0.1:${port}/trips`, {
      headers: strangerHeaders,
    });
    assert.equal(strangerListResponse.status, 200);
    const strangerTrips = await strangerListResponse.json();
    assert.equal(strangerTrips.length, 0);

    const ownerListResponse = await fetch(`http://127.0.0.1:${port}/trips`, {
      headers: ownerHeaders,
    });
    const ownerTrips = await ownerListResponse.json();
    assert.equal(ownerTrips.length, 1);
    assert.equal(ownerTrips[0].id, ownerTrip.id);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

process.on('exit', () => {
  rmSync(tempDir, { recursive: true, force: true });
});
