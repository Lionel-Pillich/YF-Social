// Kalender-Bausteine im Stil von Google/Apple Kalender – in YFN-Optik.
import { Check, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { BLOCKS, addDays, slotKey, slotStart, toDateKey } from '../../shared/schedule';
import type { SlotKey } from '../../shared/types';

const FIRST_HOUR = 10;
const LAST_HOUR = 22;
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function parseDay(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function monthLabel(days: string[]): string {
  const first = parseDay(days[0]);
  const last = parseDay(days[days.length - 1]);
  if (first.getMonth() === last.getMonth()) return `${MONTHS[first.getMonth()]} ${first.getFullYear()}`;
  return `${MONTHS[first.getMonth()].slice(0, 3)}. – ${MONTHS[last.getMonth()].slice(0, 3)}. ${last.getFullYear()}`;
}

function rangeLabel(days: string[]): string {
  const f = parseDay(days[0]);
  const l = parseDay(days[days.length - 1]);
  return `${f.getDate()}.${f.getMonth() + 1}. – ${l.getDate()}.${l.getMonth() + 1}.`;
}

interface WeekProps {
  /** Spalten des Kalenders. Mehr als 7 Tage werden auf Wochenseiten verteilt. */
  days: string[];
  /** Angebotene Slots. Ohne Angabe ist jedes zukünftige Zeitfenster wählbar (Host-Modus). */
  offered?: Set<SlotKey>;
  selected: Set<SlotKey>;
  onChange?: (next: Set<SlotKey>) => void;
  /** Zusagen je Slot (inkl. Host) und Gesamtzahl der Personen. */
  counts?: Map<SlotKey, number>;
  total?: number;
  best?: SlotKey | null;
  now: Date;
}

/** Wochenansicht mit Zeitachse; die Zeitfenster liegen als „Termine“ im Raster. */
export function CalendarWeek({ days, offered, selected, onChange, counts, total = 1, best, now }: WeekProps) {
  const pages: string[][] = [];
  for (let i = 0; i < days.length; i += 7) pages.push(days.slice(i, i + 7));
  const [page, setPage] = useState(0);
  const current = pages[Math.min(page, pages.length - 1)] ?? [];
  const today = toDateKey(now);
  const interactive = !!onChange;

  const isOpen = (s: SlotKey) => slotStart(s).getTime() > now.getTime() && (!offered || offered.has(s));

  const toggle = (s: SlotKey) => {
    if (!onChange || !isOpen(s)) return;
    const next = new Set(selected);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange(next);
  };

  const toggleDay = (day: string) => {
    if (!onChange) return;
    const slots = BLOCKS.map((b) => slotKey(day, b.id)).filter(isOpen);
    const allOn = slots.length > 0 && slots.every((s) => selected.has(s));
    const next = new Set(selected);
    slots.forEach((s) => (allOn ? next.delete(s) : next.add(s)));
    onChange(next);
  };

  if (current.length === 0) return null;

  return (
    <div className="cal">
      <div className="cal-toolbar">
        <strong>{monthLabel(current)}</strong>
        {pages.length > 1 && (
          <div className="cal-nav">
            <span className="muted small">{rangeLabel(current)}</span>
            <button type="button" className="icon-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Vorherige Woche">
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="icon-btn"
              disabled={page >= pages.length - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Nächste Woche"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
      <div className="cal-grid" style={{ '--cols': current.length } as CSSProperties}>
        <div className="cal-corner" />
        {current.map((day) => {
          const d = parseDay(day);
          const weekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <button
              key={day}
              type="button"
              className={`cal-head ${day === today ? 'is-today' : ''} ${weekend ? 'is-weekend' : ''}`}
              onClick={() => toggleDay(day)}
              disabled={!interactive}
              title={interactive ? 'Ganzen Tag auswählen' : undefined}
            >
              <span>{WEEKDAYS[d.getDay()]}</span>
              <strong>{d.getDate()}</strong>
            </button>
          );
        })}

        <div className="cal-times">
          {HOURS.map((h) => (
            <span key={h} style={{ top: `calc(${h - FIRST_HOUR} * var(--hour))` }}>
              {h}:00
            </span>
          ))}
        </div>
        {current.map((day) => {
          const weekend = [0, 6].includes(parseDay(day).getDay());
          return (
            <div key={day} className={`cal-col ${weekend ? 'is-weekend' : ''}`}>
              {BLOCKS.map((b) => {
                const s = slotKey(day, b.id);
                if (offered && !offered.has(s)) return null;
                const open = isOpen(s);
                if (!open && interactive && !offered) return null; // vergangene Slots beim Host ausblenden
                const on = selected.has(s);
                const count = counts?.get(s) ?? 0;
                const isBest = best === s;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`cal-event ${on ? 'is-on' : ''} ${open ? '' : 'is-past'} ${isBest ? 'is-best' : ''} ${
                      interactive ? '' : 'is-static'
                    }`}
                    style={
                      {
                        top: `calc(${b.startHour - FIRST_HOUR} * var(--hour) + 2px)`,
                        '--heat': counts && total ? count / total : 0,
                      } as CSSProperties
                    }
                    onClick={() => toggle(s)}
                    disabled={!interactive || !open}
                    aria-pressed={on}
                  >
                    <span className="cal-event-time">
                      {on && <Check size={14} strokeWidth={3} />}
                      {b.startHour}–{b.startHour + 2} Uhr
                    </span>
                    {counts && (
                      <span className="cal-event-count">
                        {count}/{total} können
                      </span>
                    )}
                    {counts && <span className="cal-heat" />}
                    {isBest && (
                      <span className="cal-best">
                        <Star size={11} fill="currentColor" /> Top
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MonthProps {
  /** Tage, die überhaupt angeboten werden. */
  available: Set<string>;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Hinweis je Tag, z. B. Anzahl angebotener Zeitfenster. */
  info?: Map<string, { slots: number; votes: number }>;
  now: Date;
}

/** Mini-Monatskalender zur Auswahl der Tage (Schritt 1 der Anmeldung). */
export function MonthPicker({ available, selected, onChange, info, now }: MonthProps) {
  const sorted = [...available].sort();
  if (sorted.length === 0) return <p className="muted">Keine Termine mehr verfügbar.</p>;
  const first = parseDay(sorted[0]);
  const last = parseDay(sorted[sorted.length - 1]);
  // Raster von Montag der ersten bis Sonntag der letzten Woche.
  const start = addDays(sorted[0], -((first.getDay() + 6) % 7));
  const end = addDays(sorted[sorted.length - 1], (7 - last.getDay()) % 7);
  const cells: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) cells.push(d);
  const today = toDateKey(now);

  const toggle = (day: string) => {
    const next = new Set(selected);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange(next);
  };

  return (
    <div className="month">
      <div className="cal-toolbar">
        <strong>{monthLabel(sorted)}</strong>
        <button
          type="button"
          className="link-btn small"
          onClick={() => onChange(selected.size === available.size ? new Set() : new Set(available))}
        >
          {selected.size === available.size ? 'Keine auswählen' : 'Alle Tage auswählen'}
        </button>
      </div>
      <div className="month-grid">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((w) => (
          <span key={w} className="month-wd">
            {w}
          </span>
        ))}
        {cells.map((day) => {
          const d = parseDay(day);
          const ok = available.has(day);
          const on = selected.has(day);
          const i = info?.get(day);
          return (
            <button
              key={day}
              type="button"
              className={`month-day ${ok ? 'is-open' : ''} ${on ? 'is-on' : ''} ${day === today ? 'is-today' : ''}`}
              disabled={!ok}
              onClick={() => toggle(day)}
              aria-pressed={on}
            >
              <strong>{d.getDate()}</strong>
              {ok && i && (
                <span className="month-info">
                  {i.slots} {i.slots === 1 ? 'Slot' : 'Slots'}
                  {i.votes > 0 && ` · ${i.votes}✓`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
