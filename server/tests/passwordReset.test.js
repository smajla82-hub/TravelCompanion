import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'travel-password-reset-'));
process.env.DB_PATH = path.join(tempDir, 'travel-companion-test.db');
process.env.ALLOWED_CORS_ORIGIN = 'http://localhost:5173';
process.env.PORT = '0';

const { createApp } = await import(`../src/app.js?test=${Date.now()}`);
// No cache-busting query here: this resolves to the exact same specifier
// used internally by the repositories app.js already pulled in, so it shares
// that single `better-sqlite3` connection instead of opening a second one.
const { getDb } = await import('../src/db/db.js');
const passwordResets = await import('../src/repositories/passwordResetRepository.js');

function startServer() {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

function latestResetToken() {
  return getDb()
    .prepare('SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1')
    .get();
}

function createTestResetToken(userId, expiresAt = new Date(Date.now() + 60_000).toISOString()) {
  return passwordResets.createResetToken(userId, expiresAt).token;
}

test('PUT /auth/profile sets and clears a display name', async () => {
  const { server, port } = await startServer();
  try {
    const registerResponse = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'profile-owner@example.com', password: 'correct-horse' }),
    });
    const { token, user } = await registerResponse.json();
    assert.equal(user.displayName, null);

    const updated = await fetch(`http://127.0.0.1:${port}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ displayName: '  Ada Lovelace  ' }),
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).displayName, 'Ada Lovelace');

    const tooLong = await fetch(`http://127.0.0.1:${port}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ displayName: 'x'.repeat(200) }),
    });
    assert.equal(tooLong.status, 400);

    const cleared = await fetch(`http://127.0.0.1:${port}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ displayName: '   ' }),
    });
    assert.equal((await cleared.json()).displayName, null);

    const unauthenticated = await fetch(`http://127.0.0.1:${port}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Nope' }),
    });
    assert.equal(unauthenticated.status, 401);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('forgot-password always answers with the same generic message', async () => {
  const { server, port } = await startServer();
  try {
    const registration = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'forgot-owner@example.com', password: 'correct-horse' }),
    });

    const existing = await fetch(`http://127.0.0.1:${port}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'forgot-owner@example.com' }),
    });
    const missing = await fetch(`http://127.0.0.1:${port}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody-at-all@example.com' }),
    });

    assert.equal(existing.status, 200);
    assert.equal(missing.status, 200);
    const existingBody = await existing.json();
    const missingBody = await missing.json();
    assert.equal(existingBody.message, missingBody.message);

    // Only the real account should have produced an actual reset token.
    const row = latestResetToken();
    assert.ok(row);
    assert.equal(row.token, undefined);
    assert.ok(row.token_hash);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('reset-password consumes a single-use token and updates the password', async () => {
  const { server, port } = await startServer();
  try {
    const registration = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reset-owner@example.com', password: 'original-pass' }),
    });

    const { user } = await registration.json();
    const resetToken = createTestResetToken(user.id);

    const badToken = await fetch(`http://127.0.0.1:${port}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'not-a-real-token', password: 'new-password-1' }),
    });
    assert.equal(badToken.status, 400);

    const tooShort = await fetch(`http://127.0.0.1:${port}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: 'short' }),
    });
    assert.equal(tooShort.status, 400);

    const success = await fetch(`http://127.0.0.1:${port}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: 'new-password-1' }),
    });
    assert.equal(success.status, 200);

    const reused = await fetch(`http://127.0.0.1:${port}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: 'new-password-2' }),
    });
    assert.equal(reused.status, 400);

    const loginWithNewPassword = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reset-owner@example.com', password: 'new-password-1' }),
    });
    assert.equal(loginWithNewPassword.status, 200);

    const loginWithOldPassword = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reset-owner@example.com', password: 'original-pass' }),
    });
    assert.equal(loginWithOldPassword.status, 401);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('requesting a new reset token invalidates the previous one', async () => {
  const { server, port } = await startServer();
  try {
    await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'double-reset@example.com', password: 'original-pass' }),
    });

    const login = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'double-reset@example.com', password: 'original-pass' }),
    });
    const { user } = await login.json();
    const firstToken = createTestResetToken(user.id);
    createTestResetToken(user.id);

    const usingFirstToken = await fetch(`http://127.0.0.1:${port}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: firstToken, password: 'new-password-1' }),
    });

    assert.equal(usingFirstToken.status, 400);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    test('expired reset tokens are rejected', async () => {
      const { server, port } = await startServer();
      try {
        const registration = await fetch(`http://127.0.0.1:${port}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'expired-reset@example.com', password: 'original-pass' }),
        });
        const { user } = await registration.json();
        const expiredToken = createTestResetToken(user.id, new Date(Date.now() - 1_000).toISOString());
        const response = await fetch(`http://127.0.0.1:${port}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: expiredToken, password: 'new-password-1' }),
        });
        assert.equal(response.status, 400);
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }
    });
  }
});
