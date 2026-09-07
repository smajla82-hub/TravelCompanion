import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

// Exhausting a limiter affects the whole process, so this suite runs in its own
// test file.
const tempDir = mkdtempSync(path.join(os.tmpdir(), 'travel-rate-limit-'));
process.env.DB_PATH = path.join(tempDir, 'travel-companion-test.db');
process.env.ALLOWED_CORS_ORIGIN = 'http://localhost:5173';
process.env.PORT = '0';

const { createApp } = await import(`../src/app.js?test=${Date.now()}`);

test('a rate limited trip request answers with a JSON error body', async () => {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });

  try {
    const port = server.address().port;
    let limited;

    for (let attempt = 0; attempt < 700 && !limited; attempt += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/trips`);
      if (response.status === 429) {
        limited = response;
      }
    }

    assert.ok(limited, 'expected the trips limiter to reject a request');

    // Without a JSON `error` field the client can only report an anonymous
    // "sync request could not be completed" failure.
    const body = await limited.json();
    assert.match(body.error, /Too many trip requests/);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
