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

test('an imported itinerary persists recommended venues and parking locations, day-scoped and with server-generated IDs', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'itinerary-venues-parking@example.com');
    const trip = await createTrip(port, headers, 'Garda');
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });

    const daysWithVenuesAndParking = [
      {
        date: '2026-09-01',
        title: 'DAY 1',
        items: [
          { date: '2026-09-01', title: 'Breakfast', activityType: 'food', parking: 'P1' },
          { date: '2026-09-01', title: 'Lunch', activityType: 'food', parking: 'P1' },
          { date: '2026-09-01', title: 'Museum', activityType: 'sightseeing', parking: 'P2' },
        ],
        venues: [
          {
            priority: 'MUST',
            mealType: 'breakfast',
            name: 'Caffe Roma',
            smartChip: 'Caffe Roma',
            mapLink: 'https://maps.example.com/caffe-roma',
            recommendation: 'Great espresso',
            price: '5 EUR',
          },
          { name: 'Trattoria Bella' },
        ],
        parkingLocations: [
          { code: 'P1', name: 'Central Garage', mapLink: 'https://maps.example.com/p1' },
          { code: 'P2', name: 'Lakeside Lot' },
        ],
      },
      {
        // A day with no venues/parking must round-trip as empty, not omitted
        // or defaulted from another day.
        date: '2026-09-02',
        title: 'DAY 2',
        items: [{ date: '2026-09-02', title: 'Departure', activityType: 'transfer' }],
      },
    ];

    const saved = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ days: daysWithVenuesAndParking }),
    });
    assert.equal(saved.status, 200);

    const itinerary = await getItinerary(port, headers, trip.id);
    const day1 = itinerary.days.find((day) => day.date === '2026-09-01');
    const day2 = itinerary.days.find((day) => day.date === '2026-09-02');

    // Venues persisted with server-generated stable IDs and every field intact.
    assert.equal(day1.venues.length, 2);
    assert.ok(day1.venues[0].id);
    assert.equal(day1.venues[0].name, 'Caffe Roma');
    assert.equal(day1.venues[0].priority, 'MUST');
    assert.equal(day1.venues[0].mealType, 'breakfast');
    assert.equal(day1.venues[0].mapLink, 'https://maps.example.com/caffe-roma');
    assert.equal(day1.venues[0].recommendation, 'Great espresso');
    assert.equal(day1.venues[0].price, '5 EUR');
    assert.equal(day1.venues[1].name, 'Trattoria Bella');

    // Parking locations persisted with server-generated stable IDs, keeping
    // `code` as the existing user-facing/reference key.
    assert.equal(day1.parkingLocations.length, 2);
    assert.ok(day1.parkingLocations[0].id);
    assert.equal(day1.parkingLocations[0].code, 'P1');
    assert.equal(day1.parkingLocations[0].name, 'Central Garage');
    assert.equal(day1.parkingLocations[0].mapLink, 'https://maps.example.com/p1');
    assert.equal(day1.parkingLocations[1].code, 'P2');
    assert.equal(day1.parkingLocations[1].name, 'Lakeside Lot');

    // Both "Breakfast" and "Lunch" reference the same parking code (P1) and
    // must both keep resolving against the same day-scoped parking location.
    const p1Items = day1.items.filter((item) => item.parking === 'P1');
    assert.equal(p1Items.length, 2);
    assert.deepEqual(p1Items.map((item) => item.title).sort(), ['Breakfast', 'Lunch']);
    const p1Location = day1.parkingLocations.find((location) => location.code === 'P1');
    assert.equal(p1Location.name, 'Central Garage');

    const museumItem = day1.items.find((item) => item.title === 'Museum');
    assert.equal(museumItem.parking, 'P2');
    const p2Location = day1.parkingLocations.find((location) => location.code === 'P2');
    assert.equal(p2Location.name, 'Lakeside Lot');

    // A day without venues/parking round-trips as empty arrays, never
    // inheriting data from another day.
    assert.deepEqual(day2.venues, []);
    assert.deepEqual(day2.parkingLocations, []);

    // Re-replacing the itinerary with fewer venues/parking locations must
    // fully replace the previous set, not accumulate duplicates.
    const replaced = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        days: [
          {
            date: '2026-09-01',
            title: 'DAY 1',
            items: [{ date: '2026-09-01', title: 'Only activity' }],
            venues: [{ name: 'Only Venue' }],
            parkingLocations: [],
          },
        ],
      }),
    });
    assert.equal(replaced.status, 200);

    const afterReplace = await getItinerary(port, headers, trip.id);
    assert.equal(afterReplace.days.length, 1);
    assert.equal(afterReplace.days[0].venues.length, 1);
    assert.equal(afterReplace.days[0].venues[0].name, 'Only Venue');
    assert.deepEqual(afterReplace.days[0].parkingLocations, []);
  } finally {
    await closeServer(server);
  }
});

test('a recommended venue with no name and a parking location with no code/name are rejected without persisting a partial itinerary', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'itinerary-venue-validation@example.com');
    const trip = await createTrip(port, headers, 'Garda');
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });

    const invalidVenue = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        days: [
          {
            date: '2026-09-01',
            title: 'DAY 1',
            items: [{ date: '2026-09-01', title: 'Kept' }],
            venues: [{ name: '' }],
          },
        ],
      }),
    });
    assert.equal(invalidVenue.status, 400);

    const invalidParking = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        days: [
          {
            date: '2026-09-01',
            title: 'DAY 1',
            items: [{ date: '2026-09-01', title: 'Kept' }],
            parkingLocations: [{ code: '', name: 'Missing code' }],
          },
        ],
      }),
    });
    assert.equal(invalidParking.status, 400);

    const unchanged = await getItinerary(port, headers, trip.id);
    assert.deepEqual(unchanged.days, []);
  } finally {
    await closeServer(server);
  }
});

async function createDay(port, headers, tripId, date, title) {
  const response = await fetch(`http://127.0.0.1:${port}/trips/${tripId}/itinerary/days`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ date, title }),
  });
  return response.json();
}

test('a day accepts at most 6 recommended venues, rejecting a 7th', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'venue-limit@example.com');
    const trip = await createTrip(port, headers, 'Garda');
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });
    const day = await createDay(port, headers, trip.id, '2026-09-01', 'Day 1');

    for (let index = 0; index < 6; index += 1) {
      const response = await fetch(
        `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/venues`,
        { method: 'POST', headers, body: JSON.stringify({ name: `Venue ${index + 1}` }) },
      );
      assert.equal(response.status, 201);
    }

    const seventh = await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/venues`,
      { method: 'POST', headers, body: JSON.stringify({ name: 'Venue 7' }) },
    );
    assert.equal(seventh.status, 409);

    const itinerary = await getItinerary(port, headers, trip.id);
    assert.equal(itinerary.days[0].venues.length, 6);
  } finally {
    await closeServer(server);
  }
});

test('a day accepts at most 8 parking locations, using only P1-P8 with no duplicates', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'parking-limit@example.com');
    const trip = await createTrip(port, headers, 'Garda');
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });
    const day = await createDay(port, headers, trip.id, '2026-09-01', 'Day 1');

    for (let index = 1; index <= 8; index += 1) {
      const response = await fetch(
        `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/parking`,
        { method: 'POST', headers, body: JSON.stringify({ code: `P${index}`, name: `Lot ${index}` }) },
      );
      assert.equal(response.status, 201);
    }

    const ninthCode = await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/parking`,
      { method: 'POST', headers, body: JSON.stringify({ code: 'P9', name: 'Invalid' }) },
    );
    assert.equal(ninthCode.status, 400);

    const duplicate = await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/parking`,
      { method: 'POST', headers, body: JSON.stringify({ code: 'P1', name: 'Duplicate' }) },
    );
    assert.equal(duplicate.status, 409);

    const itinerary = await getItinerary(port, headers, trip.id);
    assert.equal(itinerary.days[0].parkingLocations.length, 8);
  } finally {
    await closeServer(server);
  }
});

test('editing a recommended venue updates its fields and editing a parking location preserves its code', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'venue-parking-edit@example.com');
    const trip = await createTrip(port, headers, 'Garda');
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });
    const day = await createDay(port, headers, trip.id, '2026-09-01', 'Day 1');

    const venue = await (await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/venues`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Original', mealType: 'Lunch', subtype: 'Pizza' }),
      },
    )).json();

    const updatedVenue = await (await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/venues/${venue.id}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: 'Updated', mealType: 'Dinner', subtype: 'Sushi' }),
      },
    )).json();
    assert.equal(updatedVenue.name, 'Updated');
    assert.equal(updatedVenue.mealType, 'Dinner');
    assert.equal(updatedVenue.subtype, 'Sushi');

    const parking = await (await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/parking`,
      { method: 'POST', headers, body: JSON.stringify({ code: 'P1', name: 'Original Lot' }) },
    )).json();

    const updatedParking = await (await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/parking/${parking.id}`,
      {
        method: 'PUT',
        headers,
        // Attempting to change `code` must be silently ignored: the code
        // stays immutable after creation.
        body: JSON.stringify({ code: 'P5', name: 'Updated Lot', price: '10 EUR', note: 'Covered' }),
      },
    )).json();
    assert.equal(updatedParking.code, 'P1');
    assert.equal(updatedParking.name, 'Updated Lot');
    assert.equal(updatedParking.price, '10 EUR');
    assert.equal(updatedParking.note, 'Covered');
  } finally {
    await closeServer(server);
  }
});

test('deleting a referenced parking location is always blocked until the reference is removed', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'parking-delete-safety@example.com');
    const trip = await createTrip(port, headers, 'Garda');
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });
    const day = await createDay(port, headers, trip.id, '2026-09-01', 'Day 1');

    const parking = await (await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/parking`,
      { method: 'POST', headers, body: JSON.stringify({ code: 'P1', name: 'Lot' }) },
    )).json();

    const item = await (await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/items`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: '2026-09-01', title: 'Visit', activityType: 'other', parking: 'P1' }),
      },
    )).json();

    const blocked = await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/parking/${parking.id}`,
      { method: 'DELETE', headers },
    );
    assert.equal(blocked.status, 409);
    const blockedBody = await blocked.json();
    assert.equal(blockedBody.referencingItems.length, 1);

    const stillThere = await getItinerary(port, headers, trip.id);
    assert.equal(stillThere.days[0].parkingLocations.length, 1);

    // There is no "clear references" alternative: the request is rejected
    // outright and the query string has no effect on this behavior.
    const blockedEvenWithQueryParam = await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/parking/${parking.id}?clearReferences=true`,
      { method: 'DELETE', headers },
    );
    assert.equal(blockedEvenWithQueryParam.status, 409);

    // Once the referencing activity itself is removed, deletion succeeds.
    await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/items/${item.id}`,
      { method: 'DELETE', headers },
    );

    const deleted = await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/parking/${parking.id}`,
      { method: 'DELETE', headers },
    );
    assert.equal(deleted.status, 200);

    const afterDelete = await getItinerary(port, headers, trip.id);
    assert.equal(afterDelete.days[0].parkingLocations.length, 0);
  } finally {
    await closeServer(server);
  }
});

test('deleting a recommended venue removes it without affecting other venues or activities', async () => {
  const { server, port } = await startServer();
  try {
    const headers = await signIn(port, 'venue-delete@example.com');
    const trip = await createTrip(port, headers, 'Garda');
    await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, { method: 'POST', headers });
    const day = await createDay(port, headers, trip.id, '2026-09-01', 'Day 1');

    const venue = await (await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/venues`,
      { method: 'POST', headers, body: JSON.stringify({ name: 'To Delete' }) },
    )).json();

    const deleted = await fetch(
      `http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days/${day.id}/venues/${venue.id}`,
      { method: 'DELETE', headers },
    );
    assert.equal(deleted.status, 200);

    const itinerary = await getItinerary(port, headers, trip.id);
    assert.equal(itinerary.days[0].venues.length, 0);
  } finally {
    await closeServer(server);
  }
});
