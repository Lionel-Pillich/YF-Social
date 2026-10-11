// Soft-Karma: Punkte für Aktionen, die Interaktion im Netzwerk erzeugen.
import type { KarmaRates, PostType } from './types';

export const DEFAULT_KARMA: KarmaRates = {
  callHost: 20,
  callCheckin: 10,
  LEARNING: 8,
  DISCUSS: 5,
  SHOW: 4,
  ASK: 3,
};

/** Punkte für das Erstellen eines Beitrags (beim Call: fürs Hosten). */
export function postKarma(rates: KarmaRates, type: PostType): number {
  return type === 'CALL' ? rates.callHost : rates[type];
}

/** Reihenfolge und Beschriftung für Übersichten (absteigend nach Gewicht). */
export const KARMA_ITEMS: { key: keyof KarmaRates; label: string; short: string }[] = [
  { key: 'callHost', label: 'Call erstellen & hosten', short: 'Call hosten' },
  { key: 'callCheckin', label: 'An einem Call teilnehmen (Check-in)', short: 'Call-Teilnahme' },
  { key: 'LEARNING', label: 'LEARNING-Beitrag', short: 'Learning teilen' },
  { key: 'DISCUSS', label: 'DISCUSS-Beitrag', short: 'Diskussion starten' },
  { key: 'SHOW', label: 'SHOW-YFN-Beitrag', short: 'Projekt zeigen' },
  { key: 'ASK', label: 'ASK-YFN-Beitrag', short: 'Frage stellen' },
];
