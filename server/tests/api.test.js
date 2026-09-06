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

test('Trip CRUD flow works', async () => {
  const { server, port } = await startServer();
  try {
    const createResponse = await fetch(`http://127.0.0.1:${port}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const listResponse = await fetch(`http://127.0.0.1:${port}/trips`);
    assert.equal(listResponse.status, 200);
    const tripList = await listResponse.json();
    assert.equal(tripList.length, 1);

    const activeResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/active`, {
      method: 'PUT',
    });
    assert.equal(activeResponse.status, 200);
    const activeTrip = await activeResponse.json();
    assert.equal(activeTrip.id, createdTrip.id);
    assert.equal(activeTrip.isActive, true);

    const itineraryResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/itinerary/days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-10-01', title: 'Arrival day' }),
    });
    assert.equal(itineraryResponse.status, 201);
    const day = await itineraryResponse.json();

    const itemResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/itinerary/days/${day.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const detailResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/itinerary/days/${day.id}`);
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

process.on('exit', () => {
  rmSync(tempDir, { recursive: true, force: true });
});
