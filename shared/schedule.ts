// Termin-Matrix, Matching und Call-Status – identisch auf Server und Client.
import type { BlockId, CallData, GroupSize, Post, PostType, SlotKey } from './types';

export const BLOCKS: { id: BlockId; label: string; startHour: number }[] = [
  { id: 'b10', label: '10:00 – 12:00', startHour: 10 },
  { id: 'b14', label: '14:00 – 16:00', startHour: 14 },
  { id: 'b16', label: '16:00 – 18:00', startHour: 16 },
  { id: 'b18', label: '18:00 – 20:00', startHour: 18 },
  { id: 'b20', label: '20:00 – 22:00', startHour: 20 },
];

export const BLOCK_DURATION_MS = 2 * 60 * 60 * 1000;
/**
 * Vorlauf des Check-ins. Über die YF-Social-Admin-Einstellungen änderbar;
 * Server und Client setzen den Wert mit `setCheckinLead`.
 */
export let CHECKIN_LEAD_MS = 15 * 60 * 1000;

export function setCheckinLead(minutes: number) {
  CHECKIN_LEAD_MS = minutes * 60 * 1000;
}
export const MATRIX_DAYS = 14;

export const GROUP_SIZES: { id: GroupSize; label: string; max: number }[] = [
  { id: '2', label: '2 Personen', max: 2 },
  { id: '5', label: '5 Personen', max: 5 },
  { id: '5-10', label: '5–10 Personen', max: 10 },
  { id: '10-15', label: '10–15 Personen', max: 15 },
  { id: '15-20', label: '15–20 Personen', max: 20 },
];

export const POST_TYPES: { id: PostType; prefix: string; label: string; hint: string }[] = [
  { id: 'CALL', prefix: 'CALL', label: 'Call', hint: 'Live-Austausch mit Terminfindung' },
  { id: 'DISCUSS', prefix: 'DISCUSS', label: 'Discuss', hint: 'Diskussionen, Meinungen, Debatten' },
  { id: 'LEARNING', prefix: 'LEARNING', label: 'Learning', hint: 'Fallstudien, Playbooks, Post-Mortems' },
  { id: 'ASK', prefix: 'ASK YFN', label: 'Ask YFN', hint: 'Konkrete Fragen & Hilfegesuche' },
  { id: 'SHOW', prefix: 'SHOW YFN', label: 'Show YFN', hint: 'MVPs, Prototypen, Meilensteine' },
];


export function maxGroupSize(size: GroupSize): number {
  return GROUP_SIZES.find((g) => g.id === size)!.max;
}

/** Lokales Datum als YYYY-MM-DD. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
}

/** Die nächsten 14 Tage ab (inkl.) dem angegebenen Datum. */
export function matrixDays(from: Date): string[] {
  const start = toDateKey(from);
  return Array.from({ length: MATRIX_DAYS }, (_, i) => addDays(start, i));
}

export function slotKey(date: string, block: BlockId): SlotKey {
  return `${date}|${block}`;
}

export function parseSlot(slot: SlotKey): { date: string; block: BlockId } {
  const [date, block] = slot.split('|') as [string, BlockId];
  return { date, block };
}

export function slotStart(slot: SlotKey): Date {
  const { date, block } = parseSlot(slot);
  const [y, m, d] = date.split('-').map(Number);
  const hour = BLOCKS.find((b) => b.id === block)!.startHour;
  return new Date(y, m - 1, d, hour, 0, 0, 0);
}

export function slotEnd(slot: SlotKey): Date {
  return new Date(slotStart(slot).getTime() + BLOCK_DURATION_MS);
}

/** Alle Personen eines Calls: Host + Teilnehmende. */
export function headcount(post: Post): number {
  return 1 + (post.call?.participants.length ?? 0);
}

export function capacity(call: CallData): number {
  return call.capacityExpanded ? Infinity : maxGroupSize(call.groupSize);
}

export function isOverbooked(post: Post): boolean {
  if (!post.call) return false;
  return headcount(post) > capacity(post.call);
}

export function isFull(post: Post): boolean {
  if (!post.call) return false;
  return headcount(post) >= capacity(post.call);
}

/** Anzahl verfügbarer Personen (inkl. Host) je Slot der Host-Matrix. */
export function slotCounts(call: CallData): Map<SlotKey, number> {
  const counts = new Map<SlotKey, number>();
  for (const s of call.hostAvailability) counts.set(s, 1);
  for (const p of call.participants) {
    for (const s of p.availability) {
      if (counts.has(s)) counts.set(s, counts.get(s)! + 1);
    }
  }
  return counts;
}

/**
 * Overlapping Slot mit den meisten Übereinstimmungen zwischen Host und
 * Teilnehmenden. Vergangene Slots werden ignoriert; bei Gleichstand gewinnt
 * der früheste Termin.
 */
export function bestSlot(call: CallData, now: Date): { slot: SlotKey; count: number } | null {
  let best: { slot: SlotKey; count: number } | null = null;
  const sorted = [...slotCounts(call).entries()].sort(
    (a, b) => slotStart(a[0]).getTime() - slotStart(b[0]).getTime(),
  );
  for (const [slot, count] of sorted) {
    if (slotEnd(slot).getTime() <= now.getTime()) continue;
    if (!best || count > best.count) best = { slot, count };
  }
  return best;
}

/** Der maßgebliche Starttermin: fixierter Slot oder aktuell bester Overlap. */
export function effectiveSlot(call: CallData, now: Date): SlotKey | null {
  return call.finalSlot ?? bestSlot(call, now)?.slot ?? null;
}

export type CallPhase =
  | 'open' // sucht Teilnehmende / Terminfindung läuft
  | 'full' // vollzählig
  | 'finalized' // Termin fixiert, noch nicht begonnen
  | 'checkin' // 15 Minuten vor Start bis Ende: Check-in offen
  | 'past'; // vorbei oder kein Termin mehr möglich

export function callPhase(post: Post, now: Date): CallPhase {
  const call = post.call!;
  const slot = effectiveSlot(call, now);
  if (!slot) return 'past';
  const start = slotStart(slot).getTime();
  const end = slotEnd(slot).getTime();
  const t = now.getTime();
  if (t >= end || call.closed) return 'past';
  if (t >= start - CHECKIN_LEAD_MS) return 'checkin';
  if (call.finalSlot) return 'finalized';
  if (isFull(post)) return 'full';
  return 'open';
}

/** Farbig in der Story-Leiste nur, solange Teilnehmende gesucht werden. */
export function isCallActive(post: Post, now: Date): boolean {
  return callPhase(post, now) === 'open';
}

export function isInCall(post: Post, memberId: string): boolean {
  if (!post.call) return false;
  return post.authorId === memberId || post.call.participants.some((p) => p.memberId === memberId);
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function formatDay(dateKey: string): { weekday: string; short: string } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: WEEKDAYS[date.getDay()],
    short: `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`,
  };
}

export function formatSlot(slot: SlotKey): string {
  const { date, block } = parseSlot(slot);
  const day = formatDay(date);
  const label = BLOCKS.find((b) => b.id === block)!.label.replace(/:00/g, '').replace(' – ', '–');
  return `${day.weekday} ${day.short}, ${label} Uhr`;
}
