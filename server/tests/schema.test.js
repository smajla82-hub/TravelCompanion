import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const serverRoot = path.resolve(import.meta.dirname, '..');
const dbModule = './src/db/db.js';

function runDatabaseProbe(dbPath, setup = '') {
  const script = `
    ${setup}
    process.env.DB_PATH = ${JSON.stringify(dbPath)};
    await import(${JSON.stringify(dbModule)});
    const { getDb } = await import(${JSON.stringify(dbModule)});
    const tables = getDb().prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'password_reset_tokens') ORDER BY name",
    ).all().map(({ name }) => name);
    const columns = getDb().prepare('PRAGMA table_info(users)').all().map(({ name, notnull, dflt_value }) => ({ name, notnull, dflt_value }));
    console.log(JSON.stringify({ tables, columns }));
  `;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: serverRoot,
    env: { ...process.env, NODE_ENV: 'test', DB_PATH: dbPath },
    encoding: 'utf8',
  }));
}

test('fresh database initializes FP-7 account schema', () => {
  const dbPath = path.join(mkdtempSync(path.join(os.tmpdir(), 'travel-schema-fresh-')), 'fresh.db');
  const result = runDatabaseProbe(dbPath);
  assert.deepEqual(result.tables, ['password_reset_tokens', 'users']);
  assert.deepEqual(result.columns.filter(({ name }) => ['first_name', 'last_name', 'display_name'].includes(name)), [
    { name: 'first_name', notnull: 1, dflt_value: "''" },
    { name: 'last_name', notnull: 1, dflt_value: "''" },
    { name: 'display_name', notnull: 0, dflt_value: null },
  ]);
});

test('legacy database receives additive FP-7 account columns', () => {
  const dbPath = path.join(mkdtempSync(path.join(os.tmpdir(), 'travel-schema-legacy-')), 'legacy.db');
  const setup = `
    const Database = (await import('better-sqlite3')).default;
    const legacyDb = new Database(${JSON.stringify(dbPath)});
    legacyDb.exec("CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);");
    legacyDb.close();
  `;
  const result = runDatabaseProbe(dbPath, setup);
  assert.deepEqual(result.columns.filter(({ name }) => ['first_name', 'last_name', 'display_name'].includes(name)), [
    { name: 'display_name', notnull: 0, dflt_value: null },
    { name: 'first_name', notnull: 1, dflt_value: "''" },
    { name: 'last_name', notnull: 1, dflt_value: "''" },
  ]);
});
