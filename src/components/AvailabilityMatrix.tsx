import { BLOCKS, formatDay, slotKey, slotStart } from '../../shared/schedule';
import type { SlotKey } from '../../shared/types';

interface Props {
  days: string[];
  /** Auswählbare Slots; ohne Angabe sind alle (zukünftigen) Slots wählbar. */
  allowed?: Set<SlotKey>;
  selected: Set<SlotKey>;
  onChange?: (next: Set<SlotKey>) => void;
  /** Anzahl Zusagen je Slot – für die Heatmap-Ansicht. */
  counts?: Map<SlotKey, number>;
  maxCount?: number;
  highlight?: SlotKey | null;
  now: Date;
}

/** Termin-Matrix: Tage × vordefinierte Zeitfenster. */
export function AvailabilityMatrix({ days, allowed, selected, onChange, counts, maxCount = 1, highlight, now }: Props) {
  const readOnly = !onChange;

  const isAllowed = (s: SlotKey) =>
    slotStart(s).getTime() > now.getTime() && (allowed ? allowed.has(s) : true);

  const toggle = (s: SlotKey) => {
    if (!onChange || !isAllowed(s)) return;
    const next = new Set(selected);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange(next);
  };

  const toggleDay = (day: string) => {
    if (!onChange) return;
    const slots = BLOCKS.map((b) => slotKey(day, b.id)).filter(isAllowed);
    const allOn = slots.every((s) => selected.has(s));
    const next = new Set(selected);
    slots.forEach((s) => (allOn ? next.delete(s) : next.add(s)));
    onChange(next);
  };

  return (
    <div className="matrix-scroll">
      <table className={`matrix ${readOnly ? 'matrix-readonly' : ''}`}>
        <thead>
          <tr>
            <th />
            {days.map((day) => {
              const f = formatDay(day);
              return (
                <th key={day}>
                  <button type="button" className="matrix-day" onClick={() => toggleDay(day)} disabled={readOnly}>
                    <span>{f.weekday}</span>
                    {f.short}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {BLOCKS.map((b) => (
            <tr key={b.id}>
              <th className="matrix-block">{b.label}</th>
              {days.map((day) => {
                const s = slotKey(day, b.id);
                const ok = isAllowed(s);
                const on = selected.has(s);
                const count = counts?.get(s);
                const heat = count ? count / maxCount : 0;
                return (
                  <td key={s}>
                    <button
                      type="button"
                      className={`cell ${ok ? '' : 'cell-off'} ${on ? 'cell-on' : ''} ${highlight === s ? 'cell-best' : ''}`}
                      style={counts && count ? ({ '--heat': heat } as React.CSSProperties) : undefined}
                      onClick={() => toggle(s)}
                      disabled={readOnly || !ok}
                      aria-pressed={on}
                      title={count ? `${count} verfügbar` : undefined}
                    >
                      {counts ? (count ?? '') : on ? '✓' : ''}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
