import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

// The rate limiters are created once per process, so this suite deliberately
// lives in its own test file with its own request budget.
const tempDir = mkdtempSync(path.join(os.tmpdir(), 'travel-itinerary-'));
process.env.DB_PATH = path.join(tempDir, 'travel-companion-test.db');
process.env.ALLOWED_CORS_ORIGIN = 'http://localhost:5173';
process.env.PORT = '0';

const { createApp } = await import(`../src/app.js?test=${Date.now()}`);

function startServer() {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, port: server.address().port }));
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function signIn(port, email) {
  const response = await fetch(`http://127.0.0.1:${port}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'super-secret-1' }),
  });
  const { token } = await response.json();
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
}

async function createTrip(port, headers, name) {
  const response = await fetch(`http://127.0.0.1:${port}/trips`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, startDate: '2026-09-01', endDate: '2026-09-02' }),
  });
  return response.json();
}

function getItinerary(port, headers, tripId) {
  return fetch(`http://127.0.0.1:${port}/trips/${tripId}/itinerary`, { headers })
    .then((response) => response.json());
}

const importedDays = [
  {
    date: '2026-09-01',
    title: 'DAY 1',
    items: [
      {
        id: '2026-09-01-item-1',
        date: '2026-09-01',
        time: '08:00',
        title: 'Breakfast',
        location: 'Hotel Garda',
        activityType: 'food',
        priority: 'must',
        parking: 'P1',
        smartChip: 'Hotel Garda',
        mapLink: 'https://maps.example.com/hotel',
        price: '20 EUR',
        note: 'Buffet included',
      },
      { id: '2026-09-01-item-2', date: '2026-09-01', title: 'Museum', activityType: 'sightseeing' },
    ],
  },
  {
    date: '2026-09-02',
    title: 'DAY 2',
    items: [{ id: '2026-09-02-item-1', date: '2026-09-02', title: 'Departure', activityType: 'transfer' }],
  },
];

test('the itinerary endpoint returns the activities of every day', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'itinerary-read@example.com');
    const trip = await createTrip(port, headers, 'Garda');

    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });

    const day = await (await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: '2026-09-01', title: 'Arrival' }),
    })).json();

    const item = await (await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: '2026-09-01', title: 'Check-in', activityType: 'other' }),
    })).json();

    const itinerary = await getItinerary(port, headers, trip.id);

    assert.equal(itinerary.days.length, 1);
    assert.equal(itinerary.days[0].items.length, 1);
    assert.equal(itinerary.days[0].items[0].id, item.id);
    assert.equal(itinerary.days[0].items[0].dayId, day.id);
  } finally {
    await closeServer(server);
  }
});

test('an imported itinerary is stored, ordered and replaced atomically', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'itinerary-import@example.com');
    const trip = await createTrip(port, headers, 'BlizzCon');

    const unlocked = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ days: importedDays }),
    });
    assert.equal(unlocked.status, 409);

    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });

    const saved = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ days: importedDays }),
    });
    assert.equal(saved.status, 200);

    const itinerary = await getItinerary(port, headers, trip.id);
    assert.deepEqual(itinerary.days.map((day) => day.date), ['2026-09-01', '2026-09-02']);
    assert.deepEqual(itinerary.days[0].items.map((item) => item.title), ['Breakfast', 'Museum']);
    assert.deepEqual(itinerary.days[0].items.map((item) => item.sortOrder), [0, 1]);
    assert.equal(itinerary.days[1].items.length, 1);

    const breakfast = itinerary.days[0].items[0];
    assert.equal(breakfast.time, '08:00');
    assert.equal(breakfast.location, 'Hotel Garda');
    assert.equal(breakfast.activityType, 'food');
    assert.equal(breakfast.priority, 'must');
    assert.equal(breakfast.parking, 'P1');
    assert.equal(breakfast.smartChip, 'Hotel Garda');
    assert.equal(breakfast.mapLink, 'https://maps.example.com/hotel');
    assert.equal(breakfast.price, '20 EUR');
    assert.equal(breakfast.note, 'Buffet included');

    // An invalid activity rejects the whole request instead of persisting a
    // partial itinerary.
    const invalid = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        days: [
          { date: '2026-09-01', title: 'DAY 1', items: [{ date: '2026-09-01', title: 'Kept' }] },
          { date: '2026-09-02', title: 'DAY 2', items: [{ date: '2026-09-02', title: '' }] },
        ],
      }),
    });
    assert.equal(invalid.status, 400);
    assert.ok((await invalid.json()).error);

    const unchanged = await getItinerary(port, headers, trip.id);
    assert.deepEqual(unchanged.days[0].items.map((item) => item.title), ['Breakfast', 'Museum']);

    // Re-importing replaces the previous days instead of duplicating them.
    const replaced = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        days: [{ date: '2026-09-01', title: 'DAY 1', items: [{ date: '2026-09-01', title: 'Only activity' }] }],
      }),
    });
    assert.equal(replaced.status, 200);

    const afterReplace = await getItinerary(port, headers, trip.id);
    assert.equal(afterReplace.days.length, 1);
    assert.deepEqual(afterReplace.days[0].items.map((item) => item.title), ['Only activity']);
  } finally {
    await closeServer(server);
  }
});

test('another user cannot replace the itinerary of a trip they do not own', async () => {
  const { server, port } = await startServer();
  try {
    const owner = await signIn(port, 'itinerary-owner@example.com');
    const stranger = await signIn(port, 'itinerary-stranger@example.com');
    const trip = await createTrip(port, owner, 'Private');

    const response = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, {
      method: 'PUT',
      headers: stranger,
      body: JSON.stringify({ days: importedDays }),
    });

    assert.equal(response.status, 404);
    assert.deepEqual((await getItinerary(port, owner, trip.id)).days, []);
  } finally {
    await closeServer(server);
  }
});

test('single online activity mutations persist the offline chronological ordering semantics', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'itinerary-order@example.com');
    const trip = await createTrip(port, headers, 'Ordered');
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });
    const day = await (await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days`, {
      method: 'POST', headers, body: JSON.stringify({ date: '2026-09-01', title: 'Day 1' }),
    })).json();
    const createItem = async (title, time) => (await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/items`,
      { method: 'POST', headers, body: JSON.stringify({ date: day.date, title, time }) },
    )).json();

    const late = await createItem('Late', '12:00');
    await createItem('Untimed');
    await createItem('Early', '07:00');
    await createItem('Middle', '08:15');
    let saved = await getItinerary(port, headers, trip.id);
    assert.deepEqual(saved.days[0].items.map((item) => item.title), ['Early', 'Middle', 'Late', 'Untimed']);
    assert.deepEqual(saved.days[0].items.map((item) => item.sortOrder), [0, 1, 2, 3]);

    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/items/${late.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ time: '07:30' }),
    });
    saved = await getItinerary(port, headers, trip.id);
    assert.deepEqual(saved.days[0].items.map((item) => item.title), ['Early', 'Late', 'Middle', 'Untimed']);
    assert.deepEqual(saved.days[0].items.map((item) => item.sortOrder), [0, 1, 2, 3]);

    // Editing "Late" (now 07:30) later again must move it after "Middle".
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/items/${late.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ time: '09:00' }),
    });
    saved = await getItinerary(port, headers, trip.id);
    assert.deepEqual(saved.days[0].items.map((item) => item.title), ['Early', 'Middle', 'Late', 'Untimed']);

    // Deleting an Activity must remove only that Activity and leave the
    // remaining ordering untouched.
    const middleItem = saved.days[0].items.find((item) => item.title === 'Middle');
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/items/${middleItem.id}`, {
      method: 'DELETE', headers,
    });
    saved = await getItinerary(port, headers, trip.id);
    assert.deepEqual(saved.days[0].items.map((item) => item.title), ['Early', 'Late', 'Untimed']);

    // Two Activities sharing the same time keep their relative insertion
    // order (no arbitrary tie-break by id/creation timestamp).
    await createItem('Same B', '07:00');
    await createItem('Same A', '07:00');
    saved = await getItinerary(port, headers, trip.id);
    assert.deepEqual(
      saved.days[0].items.map((item) => item.title),
      ['Early', 'Same B', 'Same A', 'Late', 'Untimed'],
    );

    // Reloading the itinerary again (simulating navigation/refresh) must
    // reproduce the exact same order.
    const reloaded = await getItinerary(port, headers, trip.id);
    assert.deepEqual(reloaded.days[0].items.map((item) => item.title), saved.days[0].items.map((item) => item.title));
  } finally {
    await closeServer(server);
  }
});
