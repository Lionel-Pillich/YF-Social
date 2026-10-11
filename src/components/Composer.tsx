import { Lightbulb, Link2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { BLOCKS, GROUP_SIZES, POST_TYPES, matrixDays, slotKey, slotStart } from '../../shared/schedule';
import type { BlockId, GroupSize, PostType, SlotKey } from '../../shared/types';
import { api } from '../api';
import { useStore } from '../store';
import { CalendarWeek } from './Calendar';
import { postKarma } from '../../shared/karma';
import { KarmaHint, Modal } from './ui';

export function Composer({ initialType, onClose }: { initialType: PostType; onClose: () => void }) {
  const { now, run, state, me, isStaff } = useStore();
  const { enabledTypes, callCreation, karma } = state.settings;
  const canCall =
    callCreation === 'all' || isStaff || (callCreation === 'founders' && me.role === 'Founder');
  const allowed = POST_TYPES.filter((t) => enabledTypes.includes(t.id) && (t.id !== 'CALL' || canCall));
  const [type, setType] = useState<PostType>(
    allowed.some((t) => t.id === initialType) ? initialType : (allowed[0]?.id ?? 'DISCUSS'),
  );
  const muted = state.muted.includes(me.id);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [groupSize, setGroupSize] = useState<GroupSize | ''>('');
  const [linkMode, setLinkMode] = useState<'auto' | 'custom'>('auto');
  const [meetingLink, setMeetingLink] = useState('');
  const [slots, setSlots] = useState(new Set<SlotKey>());
  const [days] = useState(() => matrixDays(now));
  const [confirmFew, setConfirmFew] = useState(false);
  const dayCount = new Set([...slots].map((s) => s.split('|')[0])).size;

  /** Schnellauswahl: fügt alle zukünftigen Slots der gewählten Zeitfenster hinzu. */
  const preset = (blocks: BlockId[], weekdaysOnly = false) => {
    const next = new Set(slots);
    for (const day of days) {
      const wd = new Date(`${day}T12:00:00`).getDay();
      if (weekdaysOnly && (wd === 0 || wd === 6)) continue;
      for (const b of blocks) {
        const s = slotKey(day, b);
        if (slotStart(s).getTime() > now.getTime()) next.add(s);
      }
    }
    setSlots(next);
  };

  const isCall = type === 'CALL';
  const prefix = POST_TYPES.find((t) => t.id === type)!.prefix;
  const valid =
    title.trim() && (!isCall || (body.trim() && groupSize && (linkMode === 'auto' || /^https:\/\/\S+$/.test(meetingLink.trim())) && slots.size > 0));

  const submit = async () => {
    // Sanfter Hinweis: Mit wenigen Optionen findet sich selten ein gemeinsamer Termin.
    if (isCall && slots.size < FEW_SLOTS && !confirmFew) {
      setConfirmFew(true);
      return;
    }
    const ok = await run(
      () =>
        api.createPost({
          type,
          title,
          body,
          call: isCall
            ? {
                groupSize: groupSize as GroupSize,
                linkMode,
                meetingLink: linkMode === 'custom' ? meetingLink.trim() : undefined,
                hostAvailability: [...slots],
              }
            : undefined,
        }),
      `${isCall ? 'Call' : 'Beitrag'} veröffentlicht · +${postKarma(karma, type)} Karma`,
    );
    if (ok) onClose();
  };

  return (
    <Modal title="Beitrag erstellen" onClose={onClose} wide={isCall}>
      {muted && <div className="notice notice-warn">Dein Konto ist in YF Social aktuell stummgeschaltet.</div>}
      {!canCall && enabledTypes.includes('CALL') && (
        <p className="muted small">
          Calls können aktuell nur {callCreation === 'founders' ? 'Founder' : 'Admins & Moderatoren'} erstellen.
        </p>
      )}
      <div className="type-picker" role="radiogroup" aria-label="Beitragsart">
        {allowed.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={type === t.id}
            className={`type-option type-${t.id.toLowerCase()} ${type === t.id ? 'selected' : ''}`}
            onClick={() => setType(t.id)}
          >
            <strong>{t.prefix}</strong>
            <span>{t.hint}</span>
            <KarmaHint points={postKarma(karma, t.id)} label={`+${postKarma(karma, t.id)}`} />
          </button>
        ))}
      </div>

      <label className="field">
        <span>{isCall ? 'Thema' : type === 'ASK' ? 'Frage' : type === 'SHOW' ? 'Projekt' : 'Thema'}</span>
        <div className="prefixed">
          <span className={`type-tag type-${type.toLowerCase()}`}>{prefix}:</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
      </label>

      <label className="field">
        <span>{isCall ? 'Beschreibung – worüber soll gesprochen werden?' : 'Beitrag'}</span>
        <textarea className="input" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>

      {isCall && (
        <>
          <div className="field-row">
            <label className="field">
              <span>Ziel-Gruppengröße</span>
              <select className="input" value={groupSize} onChange={(e) => setGroupSize(e.target.value as GroupSize)}>
                <option value="" disabled>
                  Bitte wählen …
                </option>
                {GROUP_SIZES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Meeting-Raum</span>
              <div className="segmented link-mode" role="radiogroup">
                <button type="button" role="radio" aria-checked={linkMode === 'auto'} className={linkMode === 'auto' ? 'on' : ''} onClick={() => setLinkMode('auto')}>
                  <Wand2 size={16} /> Automatisch erstellen
                </button>
                <button type="button" role="radio" aria-checked={linkMode === 'custom'} className={linkMode === 'custom' ? 'on' : ''} onClick={() => setLinkMode('custom')}>
                  <Link2 size={16} /> Eigener Link
                </button>
              </div>
              {linkMode === 'auto' ? (
                <span className="muted small">
                  Beim Veröffentlichen wird ein eigener Jitsi-Meet-Raum erzeugt – ohne Konto, offen für alle mit dem Link.
                  Er wird den Teilnehmenden beim Check-in geöffnet.
                </span>
              ) : (
                <input
                  className="input"
                  placeholder="https://… (Zoom, Teams, Google Meet, WhatsApp, …)"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              )}
            </div>
          </div>
          <div className="field">
            <span>Welche Termine bietest du an? (kommende 2 Wochen)</span>
            <OptionMeter slots={slots.size} days={dayCount} />
            <div className="presets">
              <span className="muted small">Schnellauswahl:</span>
              <button type="button" className="chip-btn" onClick={() => preset(['b18', 'b20'])}>
                Alle Abende
              </button>
              <button type="button" className="chip-btn" onClick={() => preset(['b14', 'b16'], true)}>
                Werktags nachmittags
              </button>
              <button type="button" className="chip-btn" onClick={() => preset(BLOCKS.map((b) => b.id), true)}>
                Alle Werktage
              </button>
              {slots.size > 0 && (
                <button type="button" className="chip-btn chip-btn-ghost" onClick={() => setSlots(new Set())}>
                  Auswahl leeren
                </button>
              )}
            </div>
            <CalendarWeek days={days} selected={slots} onChange={(s) => (setSlots(s), setConfirmFew(false))} now={now} />
            <span className="muted small">Tipp: Klick auf einen Wochentag im Kopf wählt alle Zeitfenster des Tages.</span>
          </div>
          {confirmFew && (
            <div className="notice notice-warn">
              <Lightbulb size={18} />
              <div>
                <strong>Nur {slots.size} {slots.size === 1 ? 'Terminoption' : 'Terminoptionen'}?</strong> Mit mehr Optionen
                ist die Chance viel größer, dass alle einen gemeinsamen Termin finden. Du kannst trotzdem so veröffentlichen.
              </div>
            </div>
          )}
        </>
      )}

      <div className="modal-actions">
        <span className="karma-earn">
          <KarmaHint
            points={postKarma(karma, type)}
            label={`Hierfür erhältst du +${postKarma(karma, type)} Karma-Punkte`}
          />
          {isCall && <span className="muted small">+ {karma.callCheckin} pro Check-in, wenn der Call stattfindet</span>}
        </span>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-primary" disabled={!valid || muted} onClick={submit}>
          {confirmFew ? 'Trotzdem veröffentlichen' : 'Veröffentlichen'}
        </button>
      </div>
    </Modal>
  );
}

const FEW_SLOTS = 4;
const GOOD_SLOTS = 8;
const GOOD_DAYS = 4;

/** Ermutigt den Host, möglichst viele Terminoptionen anzubieten. */
function OptionMeter({ slots, days }: { slots: number; days: number }) {
  const level =
    slots === 0 ? 0 : slots < FEW_SLOTS ? 1 : slots < GOOD_SLOTS || days < GOOD_DAYS ? 2 : slots < 12 ? 3 : 4;
  const text = [
    `Wähle Zeitfenster im Kalender. Empfehlung: mindestens ${GOOD_SLOTS} Optionen an ${GOOD_DAYS} verschiedenen Tagen.`,
    'Sehr wenige Optionen – ein gemeinsamer Termin ist unwahrscheinlich. Füge weitere hinzu!',
    `Guter Anfang. Mit ${GOOD_SLOTS}+ Optionen an ${GOOD_DAYS}+ Tagen steigen die Chancen deutlich.`,
    'Sehr gut – viele Teilnehmende werden einen passenden Termin finden.',
    'Hervorragend! Damit findet das System fast sicher einen Schnitttermin.',
  ][level];
  return (
    <div className={`meter meter-${level}`}>
      <div className="meter-bar">
        {[1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= level ? 'on' : ''} />
        ))}
      </div>
      <div className="meter-text">
        <strong>
          {slots} {slots === 1 ? 'Option' : 'Optionen'} · {days} {days === 1 ? 'Tag' : 'Tage'}
        </strong>
        <span>{text}</span>
      </div>
    </div>
  );
}
