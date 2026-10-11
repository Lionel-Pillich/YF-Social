// Minimaler Datenspeicher – bewusst simpel für den Prototyp. Wo die Daten
// liegen (JSON-Datei auf dem Server, localStorage im Browser), legt die
// jeweilige Umgebung über `configureDb` fest.
import { setCheckinLead } from '../shared/schedule';
import type { Database } from '../shared/types';
import { DB_VERSION, createSeed, type SeedPack } from './seed';

export interface Storage {
  load(): string | null;
  save(data: string): void;
}

let db: Database;
let storage: Storage;
let pack: SeedPack;

export function configureDb(s: Storage, p: SeedPack): Database {
  storage = s;
  pack = p;
  const raw = storage.load();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Database;
      if (parsed.version === DB_VERSION) {
        db = parsed;
        setCheckinLead(db.settings.checkinLeadMin);
        return db;
      }
    } catch {
      /* beschädigte Daten → neu seeden */
    }
  }
  return resetDb();
}

export function resetDb(): Database {
  db = createSeed(pack);
  setCheckinLead(db.settings.checkinLeadMin);
  saveDb();
  return db;
}

export function getDb(): Database {
  return db;
}

export function saveDb(): void {
  storage.save(JSON.stringify(db, null, 2));
}

/** Serverzeit inkl. Demo-Zeitverschiebung. */
export function now(): Date {
  return new Date(Date.now() + db.clockOffsetMs);
}
