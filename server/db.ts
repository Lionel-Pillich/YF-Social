// Minimaler JSON-Dateispeicher – bewusst simpel für den Prototyp.
import fs from 'node:fs';
import path from 'node:path';
import { setCheckinLead } from '../shared/schedule';
import type { Database } from '../shared/types';
import { createSeed } from './seed';

const DB_FILE = path.resolve(import.meta.dirname, '../data/db.json');
const DB_VERSION = 3;

let db: Database;

export function loadDb(): Database {
  if (fs.existsSync(DB_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as Database;
    if (parsed.version === DB_VERSION) {
      db = parsed;
      setCheckinLead(db.settings.checkinLeadMin);
      return db;
    }
  }
  return resetDb();
}

export function resetDb(): Database {
  db = createSeed();
  setCheckinLead(db.settings.checkinLeadMin);
  saveDb();
  return db;
}

export function getDb(): Database {
  return db;
}

export function saveDb(): void {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/** Serverzeit inkl. Demo-Zeitverschiebung. */
export function now(): Date {
  return new Date(Date.now() + db.clockOffsetMs);
}
