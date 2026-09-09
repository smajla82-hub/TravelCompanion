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

function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function captureConsoleMessages(messages) {
  return (...args) => {
    messages.push(args.map((value) => {
      if (value instanceof Error) {
        return [value.code, value.message, value.stack].filter(Boolean).join(' ');
      }
      return typeof value === 'string' ? value : JSON.stringify(value);
    }).join(' '));
  };
}

test('Express derives the client IP from exactly one trusted proxy without rate-limit proxy errors', async () => {
  const app = createApp();
  app.get('/__test/ip', (req, res) => {
    res.json({ ip: req.ip, ips: req.ips });
  });

  const consoleErrors = [];
  const originalConsoleError = console.error;
  console.error = captureConsoleMessages(consoleErrors);

  const server = await startServer(app);
  try {
    const port = server.address().port;

    const ipResponse = await fetch(`http://127.0.0.1:${port}/__test/ip`, {
      headers: { 'X-Forwarded-For': '203.0.113.10' },
    });
    assert.equal(ipResponse.status, 200);
    assert.deepEqual(await ipResponse.json(), {
      ip: '203.0.113.10',
      ips: ['203.0.113.10'],
    });

    const loginResponse = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '203.0.113.10',
      },
      body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong-password' }),
    });
    assert.equal(loginResponse.status, 401);
    assert.equal(
      consoleErrors.some((message) => message.includes('ERR_ERL_UNEXPECTED_X_FORWARDED_FOR')),
      false,
    );
  } finally {
    console.error = originalConsoleError;
    await closeServer(server);
  }
});

test('a rate limited trip request answers with a JSON error body', async () => {
  const app = createApp();
  const server = await startServer(app);

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
    await closeServer(server);
  }
});
