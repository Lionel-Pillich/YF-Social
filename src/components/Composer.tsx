import { useState } from 'react';
import { GROUP_SIZES, POST_TYPES, matrixDays } from '../../shared/schedule';
import type { GroupSize, PostType, SlotKey } from '../../shared/types';
import { api } from '../api';
import { useStore } from '../store';
import { AvailabilityMatrix } from './AvailabilityMatrix';
import { Modal } from './ui';

export function Composer({ initialType, onClose }: { initialType: PostType; onClose: () => void }) {
  const { now, run, state, me, isStaff } = useStore();
  const { enabledTypes, callCreation, karmaHost } = state.settings;
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
  const [meetingLink, setMeetingLink] = useState('');
  const [slots, setSlots] = useState(new Set<SlotKey>());
  const [days] = useState(() => matrixDays(now));

  const isCall = type === 'CALL';
  const prefix = POST_TYPES.find((t) => t.id === type)!.prefix;
  const valid =
    title.trim() && (!isCall || (body.trim() && groupSize && /^https?:\/\/\S+/.test(meetingLink) && slots.size > 0));

  const submit = async () => {
    const ok = await run(
      () =>
        api.createPost({
          type,
          title,
          body,
          call: isCall ? { groupSize: groupSize as GroupSize, meetingLink, hostAvailability: [...slots] } : undefined,
        }),
      isCall ? `Call veröffentlicht · +${karmaHost} Karma fürs Hosten` : 'Beitrag veröffentlicht',
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
            <label className="field">
              <span>Meeting-Link (Zoom, Teams, WhatsApp, …)</span>
              <input
                className="input"
                placeholder="https://…"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </label>
          </div>
          <div className="field">
            <span>Deine Verfügbarkeit in den kommenden 2 Wochen · {slots.size} Zeitfenster gewählt</span>
            <AvailabilityMatrix days={days} selected={slots} onChange={setSlots} now={now} />
            <span className="muted small">Tipp: Klick auf einen Tag wählt alle Zeitfenster des Tages.</span>
          </div>
        </>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-primary" disabled={!valid || muted} onClick={submit}>
          Veröffentlichen
        </button>
      </div>
    </Modal>
  );
}
