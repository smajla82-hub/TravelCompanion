import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { config } from '../config.js';

const dataDir = path.dirname(config.dbPath);
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url));
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

export function getDb() {
  return db;
}

export function closeDb() {
  db.close();
}
