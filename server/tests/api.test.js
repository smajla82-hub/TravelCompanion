import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'travel-api-'));
process.env.DB_PATH = path.join(tempDir, 'travel-companion-test.db');
process.env.ALLOWED_CORS_ORIGIN = 'http://localhost:5173';
process.env.PORT = '0';
process.env.TRIP_LOCK_TTL_MS = '30';

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
    assert.equal(createdTrip.country, 'CZ');

    const invalidCountryResponse = await fetch(`http://127.0.0.1:${port}/trips`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Invalid country', destination: 'Nowhere', country: 'Atlantis',
        startDate: '2026-10-01', endDate: '2026-10-03',
      }),
    });
    assert.equal(invalidCountryResponse.status, 400);

    const listResponse = await fetch(`http://127.0.0.1:${port}/trips`, { headers: authHeaders });
    assert.equal(listResponse.status, 200);
    const tripList = await listResponse.json();
    assert.equal(tripList.length, 1);

    const lockResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/lock`, {
      method: 'POST', headers: authHeaders,
    });
    assert.equal(lockResponse.status, 200);

    const activeResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}/active`, {
      method: 'PUT',
      headers: authHeaders,
    });
    assert.equal(activeResponse.status, 200);
    const activeTrip = await activeResponse.json();
    assert.equal(activeTrip.id, createdTrip.id);
    assert.equal(activeTrip.isActive, true);

    const invalidUpdateResponse = await fetch(`http://127.0.0.1:${port}/trips/${createdTrip.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ name: '', country: 'Atlantis' }),
    });
    assert.equal(invalidUpdateResponse.status, 400);

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

test('active trips are selected independently for each authenticated user', async () => {
  const { server, port } = await startServer();
  try {
    const [{ randomUUID }, jwt, { config }, { getDb }] = await Promise.all([
      import('node:crypto'),
      import('jsonwebtoken'),
      import('../src/config.js'),
      import('../src/db/db.js'),
    ]);
    const createUser = (email) => {
      const user = { id: randomUUID(), email };
      getDb().prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
        user.id, user.email, 'test-password-hash',
      );
      const token = jwt.default.sign({ email }, config.jwtSecret, { subject: user.id });
      return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
    };
    const alice = createUser('active-alice@example.com');
    const bob = createUser('active-bob@example.com');
    const aliceTrip = await (await fetch(`http://127.0.0.1:${port}/trips`, {
      method: 'POST', headers: alice,
      body: JSON.stringify({ name: 'Alice trip', startDate: '2026-10-01', endDate: '2026-10-02' }),
    })).json();
    const bobTrip = await (await fetch(`http://127.0.0.1:${port}/trips`, {
      method: 'POST', headers: bob,
      body: JSON.stringify({ name: 'Bob trip', startDate: '2026-10-01', endDate: '2026-10-02' }),
    })).json();
    await fetch(`http://127.0.0.1:${port}/trips/${aliceTrip.id}/lock`, { method: 'POST', headers: alice });
    await fetch(`http://127.0.0.1:${port}/trips/${bobTrip.id}/lock`, { method: 'POST', headers: bob });
    assert.equal((await fetch(`http://127.0.0.1:${port}/trips/${aliceTrip.id}/active`, {
      method: 'PUT', headers: alice,
    })).status, 200);
    assert.equal((await fetch(`http://127.0.0.1:${port}/trips/${bobTrip.id}/active`, {
      method: 'PUT', headers: bob,
    })).status, 200);

    assert.equal((await (await fetch(`http://127.0.0.1:${port}/trips/active`, { headers: alice })).json()).id, aliceTrip.id);
    assert.equal((await (await fetch(`http://127.0.0.1:${port}/trips/active`, { headers: bob })).json()).id, bobTrip.id);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('shared trip viewers can set that trip as their own active trip without an edit lock', async () => {
  const { server, port } = await startServer();
  try {
    const registerUser = async (email) => {
      const response = await fetch(`http://127.0.0.1:${port}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'super-secret-1' }),
      });
      const { token, user } = await response.json();
      return { user, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } };
    };
    const owner = await registerUser('viewer-active-owner@example.com');
    const viewer = await registerUser('viewer-active-viewer@example.com');

    const createResponse = await fetch(`http://127.0.0.1:${port}/trips`, {
      method: 'POST',
      headers: owner.headers,
      body: JSON.stringify({ name: 'Viewer active trip', startDate: '2026-10-01', endDate: '2026-10-03' }),
    });
    const trip = await createResponse.json();

    const invitationResponse = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/invitations`, {
      method: 'POST',
      headers: owner.headers,
      body: JSON.stringify({ email: viewer.user.email, role: 'viewer' }),
    });
    assert.equal(invitationResponse.status, 201);
    const invitation = await invitationResponse.json();

    const acceptViewer = await fetch(`http://127.0.0.1:${port}/invitations/${invitation.token}/accept`, {
      method: 'POST',
      headers: viewer.headers,
    });
    assert.equal(acceptViewer.status, 200);

    const activateViewerTrip = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/active`, {
      method: 'PUT',
      headers: viewer.headers,
    });
    assert.equal(activateViewerTrip.status, 200);
    assert.equal((await activateViewerTrip.json()).id, trip.id);

    const activeTrip = await fetch(`http://127.0.0.1:${port}/trips/active`, { headers: viewer.headers });
    assert.equal(activeTrip.status, 200);
    assert.equal((await activeTrip.json()).id, trip.id);

    const viewerLock = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'POST',
      headers: viewer.headers,
    });
    assert.equal(viewerLock.status, 403);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('legacy unowned trips remain authenticated ownerless shared data', async () => {
  const { server, port } = await startServer();
  try {
    const [{ randomUUID }, jwt, { config }, { getDb }] = await Promise.all([
      import('node:crypto'),
      import('jsonwebtoken'),
      import('../src/config.js'),
      import('../src/db/db.js'),
    ]);
    const createUser = (email) => {
      const user = { id: randomUUID(), email };
      getDb().prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
        user.id, user.email, 'test-password-hash',
      );
      const token = jwt.default.sign({ email }, config.jwtSecret, { subject: user.id });
      return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
    };
    const firstUser = createUser('legacy-first@example.com');
    const secondUser = createUser('legacy-second@example.com');
    const tripId = randomUUID();
    getDb().prepare(
      `INSERT INTO trips (id, name, destination, country, start_date, end_date, travellers, status, is_active, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    ).run(tripId, 'Legacy trip', '', '', '2026-11-01', '2026-11-02', 1, 'planning', 0);

    assert.equal((await fetch(`http://127.0.0.1:${port}/trips/${tripId}`)).status, 401);
    assert.equal((await fetch(`http://127.0.0.1:${port}/trips/${tripId}`, { headers: secondUser })).status, 200);
    assert.equal((await fetch(`http://127.0.0.1:${port}/trips/${tripId}/lock`, {
      method: 'POST', headers: firstUser,
    })).status, 200);
    assert.equal((await fetch(`http://127.0.0.1:${port}/trips/${tripId}`, {
      method: 'PUT', headers: firstUser, body: JSON.stringify({ name: 'Updated legacy trip' }),
    })).status, 200);
    assert.equal(getDb().prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId).user_id, null);
    assert.equal((await fetch(`http://127.0.0.1:${port}/trips/${tripId}/invitations`, {
      method: 'POST',
      headers: firstUser,
      body: JSON.stringify({ email: 'anyone@example.com', role: 'viewer' }),
    })).status, 403);

    const explicitlySharedTripId = randomUUID();
    getDb().prepare(
      `INSERT INTO trips (id, name, destination, country, start_date, end_date, travellers, status, is_active, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    ).run(explicitlySharedTripId, 'Explicit legacy trip', '', '', '2026-11-01', '2026-11-02', 1, 'planning', 0);
    const explicitMemberId = getDb().prepare('SELECT id FROM users WHERE email = ?').get('legacy-first@example.com').id;
    getDb().prepare(
      `INSERT INTO trip_members (trip_id, user_id, role, created_at, updated_at)
       VALUES (?, ?, 'viewer', datetime('now'), datetime('now'))`,
    ).run(explicitlySharedTripId, explicitMemberId);

    assert.equal((await fetch(`http://127.0.0.1:${port}/trips/${explicitlySharedTripId}`, {
      headers: firstUser,
    })).status, 200);
    assert.equal((await fetch(`http://127.0.0.1:${port}/trips/${explicitlySharedTripId}`, {
      headers: secondUser,
    })).status, 404);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('shared trip invitations and roles enforce access', async () => {
  const { server, port } = await startServer();
  try {
    const registerUser = async (email) => {
      const response = await fetch(`http://127.0.0.1:${port}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'super-secret-1' }),
      });
      const { token, user } = await response.json();
      return { user, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } };
    };
    const owner = await registerUser('shared-owner@example.com');
    const editor = await registerUser('shared-editor@example.com');
    const viewer = await registerUser('shared-viewer@example.com');
    const stranger = await registerUser('shared-stranger@example.com');

    const createResponse = await fetch(`http://127.0.0.1:${port}/trips`, {
      method: 'POST',
      headers: owner.headers,
      body: JSON.stringify({ name: 'Shared trip', startDate: '2026-10-01', endDate: '2026-10-03' }),
    });
    const trip = await createResponse.json();

    const invite = async (user, role) => {
      const response = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/invitations`, {
        method: 'POST',
        headers: owner.headers,
        body: JSON.stringify({ email: user.user.email, role }),
      });
      assert.equal(response.status, 201);
      return response.json();
    };
    const editorInvitation = await invite(editor, 'editor');
    const viewerInvitation = await invite(viewer, 'viewer');
    assert.ok(editorInvitation.token);
    assert.equal(editorInvitation.acceptLink, `/accept-invite/${editorInvitation.token}`);
    const { getDb } = await import('../src/db/db.js');
    const invitationsBeforeSend = getDb()
      .prepare('SELECT COUNT(*) AS count FROM invitations WHERE trip_id = ?')
      .get(trip.id).count;

    const sendInvitationEmail = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/invitations/${editorInvitation.id}/send-email`, {
      method: 'POST',
      headers: owner.headers,
    });
    assert.equal(sendInvitationEmail.status, 200);
    const sentInvitationPayload = await sendInvitationEmail.json();
    assert.equal(sentInvitationPayload.sent, true);
    assert.equal(sentInvitationPayload.invitation.id, editorInvitation.id);
    const invitationsAfterSend = getDb()
      .prepare('SELECT COUNT(*) AS count FROM invitations WHERE trip_id = ?')
      .get(trip.id).count;
    assert.equal(invitationsAfterSend, invitationsBeforeSend);

    const resendInvitationEmail = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/invitations/${editorInvitation.id}/send-email`, {
      method: 'POST',
      headers: owner.headers,
    });
    assert.equal(resendInvitationEmail.status, 200);
    const resendPayload = await resendInvitationEmail.json();
    assert.equal(resendPayload.sent, true);
    assert.equal(resendPayload.invitation.id, editorInvitation.id);
    const invitationsAfterResend = getDb()
      .prepare('SELECT COUNT(*) AS count FROM invitations WHERE trip_id = ?')
      .get(trip.id).count;
    assert.equal(invitationsAfterResend, invitationsBeforeSend);

    const wrongRecipient = await fetch(`http://127.0.0.1:${port}/invitations/${editorInvitation.token}/accept`, {
      method: 'POST', headers: stranger.headers,
    });
    assert.equal(wrongRecipient.status, 403);

    const acceptEditor = await fetch(`http://127.0.0.1:${port}/invitations/${editorInvitation.token}/accept`, {
      method: 'POST', headers: editor.headers,
    });
    assert.equal(acceptEditor.status, 200);
    assert.equal((await acceptEditor.json()).status, 'accepted');

    const rejectViewer = await fetch(`http://127.0.0.1:${port}/invitations/${viewerInvitation.token}/reject`, {
      method: 'POST', headers: viewer.headers,
    });
    assert.equal(rejectViewer.status, 200);
    assert.equal((await rejectViewer.json()).status, 'rejected');

    const editorTrips = await fetch(`http://127.0.0.1:${port}/trips`, { headers: editor.headers });
    assert.equal((await editorTrips.json()).some((entry) => entry.id === trip.id), true);
    const editorLock = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'POST', headers: editor.headers,
    });
    assert.equal(editorLock.status, 200);
    const editorUpdate = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}`, {
      method: 'PUT', headers: editor.headers,
      body: JSON.stringify({ name: 'Edited shared trip' }),
    });
    assert.equal(editorUpdate.status, 200);
    const editorInvite = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/invitations`, {
      method: 'POST', headers: editor.headers,
      body: JSON.stringify({ email: 'nope@example.com', role: 'viewer' }),
    });
    assert.equal(editorInvite.status, 403);
    const editorDelete = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}`, {
      method: 'DELETE', headers: editor.headers,
    });
    assert.equal(editorDelete.status, 403);

    const secondViewer = await registerUser('second-viewer@example.com');
    const secondViewerInvitation = await invite(secondViewer, 'viewer');
    const acceptViewer = await fetch(`http://127.0.0.1:${port}/invitations/${secondViewerInvitation.token}/accept`, {
      method: 'POST', headers: secondViewer.headers,
    });
    assert.equal(acceptViewer.status, 200);
    const viewerRead = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary`, { headers: secondViewer.headers });
    assert.equal(viewerRead.status, 200);
    const viewerWrite = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/itinerary/days`, {
      method: 'POST', headers: secondViewer.headers, body: JSON.stringify({ date: '2026-10-01' }),
    });
    assert.equal(viewerWrite.status, 403);

    const membersResponse = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/members`, { headers: editor.headers });
    const tripMembers = await membersResponse.json();
    assert.equal(tripMembers.length, 3);
    const viewerMember = tripMembers.find((member) => member.userId === secondViewer.user.id);
    const changeRole = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/members/${viewerMember.userId}`, {
      method: 'PUT', headers: owner.headers, body: JSON.stringify({ role: 'editor' }),
    });
    assert.equal(changeRole.status, 200);
    const removeMember = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/members/${viewerMember.userId}`, {
      method: 'DELETE', headers: owner.headers,
    });
    assert.equal(removeMember.status, 200);
    const removeOwner = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/members/${owner.user.id}`, {
      method: 'DELETE', headers: owner.headers,
    });
    assert.equal(removeOwner.status, 400);

    const revocable = await invite(stranger, 'viewer');
    const revoke = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/invitations/${revocable.id}`, {
      method: 'DELETE', headers: owner.headers,
    });
    assert.equal(revoke.status, 200);
    const revokedAccept = await fetch(`http://127.0.0.1:${port}/invitations/${revocable.token}/accept`, {
      method: 'POST', headers: stranger.headers,
    });
    assert.equal(revokedAccept.status, 400);

    const expired = await invite(stranger, 'viewer');
    getDb().prepare('UPDATE invitations SET expires_at = ? WHERE id = ?').run('2000-01-01T00:00:00.000Z', expired.id);
    const expiredReject = await fetch(`http://127.0.0.1:${port}/invitations/${expired.token}/reject`, {
      method: 'POST', headers: stranger.headers,
    });
    assert.equal(expiredReject.status, 400);
    const invitationList = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/invitations`, { headers: owner.headers });
    assert.equal((await invitationList.json()).find((entry) => entry.id === expired.id).status, 'expired');

    const strangerTrip = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}`, { headers: stranger.headers });
    assert.equal(strangerTrip.status, 404);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('trip edit locks enforce exclusive edits and permit only current offline writes', async () => {
  const { server, port } = await startServer();
  try {
    const registerUser = async (email) => {
      const [{ randomUUID }, jwt, { config }, { getDb }] = await Promise.all([
        import('node:crypto'),
        import('jsonwebtoken'),
        import('../src/config.js'),
        import('../src/db/db.js'),
      ]);
      const user = { id: randomUUID(), email };
      getDb().prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
        user.id, user.email, 'test-password-hash',
      );
      const token = jwt.default.sign({ email }, config.jwtSecret, { subject: user.id });
      return { user, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } };
    };
    const owner = await registerUser('lock-owner@example.com');
    const editor = await registerUser('lock-editor@example.com');
    const viewer = await registerUser('lock-viewer@example.com');
    const create = await fetch(`http://127.0.0.1:${port}/trips`, {
      method: 'POST',
      headers: owner.headers,
      body: JSON.stringify({ name: 'Locked trip', startDate: '2026-10-01', endDate: '2026-10-03' }),
    });
    const trip = await create.json();
    const { getDb } = await import('../src/db/db.js');
    getDb().prepare(
      `INSERT INTO trip_members (trip_id, user_id, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(trip.id, editor.user.id, 'editor', trip.created_at, trip.updated_at);
    getDb().prepare(
      `INSERT INTO trip_members (trip_id, user_id, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(trip.id, viewer.user.id, 'viewer', trip.created_at, trip.updated_at);

    const ownerLock = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'POST', headers: owner.headers,
    });
    assert.equal(ownerLock.status, 200);
    const firstLock = await ownerLock.json();
    const blocked = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'POST', headers: editor.headers,
    });
    assert.equal(blocked.status, 409);
    assert.deepEqual((await blocked.json()).lockedBy, { userId: owner.user.id, email: owner.user.email });
    const viewerLock = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'POST', headers: viewer.headers,
    });
    assert.equal(viewerLock.status, 403);

    await new Promise((resolve) => setTimeout(resolve, 5));
    const heartbeat = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock/heartbeat`, {
      method: 'PUT', headers: owner.headers,
    });
    assert.equal(heartbeat.status, 200);
    assert.ok(Date.parse((await heartbeat.json()).expiresAt) >= Date.parse(firstLock.expiresAt));
    const release = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'DELETE', headers: owner.headers,
    });
    assert.equal(release.status, 200);

    const editorLock = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'POST', headers: editor.headers,
    });
    assert.equal(editorLock.status, 200);
    const forceRelease = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'DELETE', headers: owner.headers,
    });
    assert.equal(forceRelease.status, 200);
    const noLockWrite = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}`, {
      method: 'PUT', headers: owner.headers, body: JSON.stringify({ name: 'Rejected edit' }),
    });
    assert.equal(noLockWrite.status, 409);

    const current = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}`, { headers: owner.headers });
    const currentTrip = await current.json();
    const offlineWrite = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}`, {
      method: 'PUT',
      headers: owner.headers,
      body: JSON.stringify({ name: 'Offline edit', clientUpdatedAt: currentTrip.updated_at }),
    });
    assert.equal(offlineWrite.status, 200);
    const staleWrite = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}`, {
      method: 'PUT',
      headers: owner.headers,
      body: JSON.stringify({ name: 'Stale offline edit', clientUpdatedAt: '2000-01-01T00:00:00.000Z' }),
    });
    assert.equal(staleWrite.status, 409);

    const expiringLock = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'POST', headers: editor.headers,
    });
    assert.equal(expiringLock.status, 200);
    await new Promise((resolve) => setTimeout(resolve, 40));
    const replacementLock = await fetch(`http://127.0.0.1:${port}/trips/${trip.id}/lock`, {
      method: 'POST', headers: owner.headers,
    });
    assert.equal(replacementLock.status, 200);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

process.on('exit', () => {
  rmSync(tempDir, { recursive: true, force: true });
});
