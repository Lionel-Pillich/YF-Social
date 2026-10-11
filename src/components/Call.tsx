import { ArrowLeft, ArrowRight, CalendarCheck, Check, Copy, Expand, FastForward, LogIn, TriangleAlert, Unlock, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CHECKIN_LEAD_MS,
  GROUP_SIZES,
  bestSlot,
  callPhase,
  capacity,
  effectiveSlot,
  formatSlot,
  headcount,
  isInCall,
  isOverbooked,
  maxGroupSize,
  slotCounts,
  slotStart,
} from '../../shared/schedule';
import type { Post, SlotKey } from '../../shared/types';
import { api } from '../api';
import { useStore } from '../store';
import { CalendarWeek, MonthPicker } from './Calendar';
import { MemberAvatar, MemberName, Modal, TypeTag } from './ui';

type CallPost = Post & { call: NonNullable<Post['call']> };

const PHASE_TEXT = {
  open: 'Terminfindung läuft',
  full: 'Vollzählig',
  finalized: 'Termin fixiert',
  checkin: 'Check-in offen',
  past: 'Beendet',
} as const;

function hostDays(post: CallPost): string[] {
  return [...new Set(post.call.hostAvailability.map((s) => s.split('|')[0]))].sort();
}

export function sizeLabel(post: CallPost): string {
  const max = post.call.capacityExpanded ? '∞' : String(maxGroupSize(post.call.groupSize));
  return `${headcount(post)}/${max}`;
}

/** Kompakte Call-Infos im Feed. */
export function CallSummary({ post }: { post: CallPost }) {
  const { now, openCall } = useStore();
  const phase = callPhase(post, now);
  const best = bestSlot(post.call, now);
  const slot = effectiveSlot(post.call, now);
  const group = GROUP_SIZES.find((g) => g.id === post.call.groupSize)!;

  return (
    <div className={`call-box phase-${phase}`}>
      <div className="call-facts">
        <div>
          <span className="fact-label">Status</span>
          <span className={`phase-pill phase-pill-${phase}`}>{PHASE_TEXT[phase]}</span>
        </div>
        <div>
          <span className="fact-label">Gruppe</span>
          <span>
            {sizeLabel(post)} · {group.label}
          </span>
        </div>
        <div>
          <span className="fact-label">{post.call.finalSlot ? 'Termin' : 'Bester Termin'}</span>
          <span>
            {slot ? formatSlot(slot) : '–'}
            {!post.call.finalSlot && best && phase !== 'past' && (
              <em className="muted">
                {' '}
                · {best.count}/{headcount(post)} können
              </em>
            )}
          </span>
        </div>
      </div>
      <div className="call-people">
        <MemberAvatar id={post.authorId} size={34} />
        {post.call.participants.map((p) => (
          <MemberAvatar key={p.memberId} id={p.memberId} size={34} />
        ))}
        <button type="button" className="link-btn" onClick={() => openCall(post.id)}>
          Details & Termine
        </button>
      </div>
      <CallActions post={post} />
    </div>
  );
}

/** Teilnahme-, Check-in- und Abmelde-Buttons – im Feed und im Detail-Modal. */
export function CallActions({ post }: { post: CallPost }) {
  const { me, now, run, apply, toast, state } = useStore();
  const [joining, setJoining] = useState(false);
  const phase = callPhase(post, now);
  const isHost = post.authorId === me.id;
  const inCall = isInCall(post, me.id);
  const checkedIn = post.call.checkIns.includes(me.id);
  const slot = effectiveSlot(post.call, now);

  const checkIn = async () => {
    // Fenster vorab öffnen, damit der Popup-Blocker nicht greift.
    const win = window.open('', '_blank');
    try {
      const res = await api.checkIn(post.id);
      apply(res.state);
      if (win) win.location.href = res.meetingLink;
      else window.location.href = res.meetingLink;
      toast(checkedIn ? 'Weiter zum Meeting …' : `Eingecheckt! +${state.settings.karmaCheckin} Karma`);
    } catch (e) {
      win?.close();
      toast((e as Error).message, 'error');
    }
  };

  let content;
  if (phase === 'past') {
    content = (
      <span className="muted">
        Call beendet · {post.call.checkIns.length} {post.call.checkIns.length === 1 ? 'Person' : 'Personen'} eingecheckt
        {checkedIn && ' · du warst dabei'}
      </span>
    );
  } else if (phase === 'checkin' && inCall) {
    content = (
      <button type="button" className="btn btn-checkin" onClick={checkIn}>
        <Video size={20} />
        {checkedIn ? 'Erneut zum Meeting' : 'Jetzt dem Call beitreten & einchecken'}
      </button>
    );
  } else if (isHost) {
    content = (
      <span className="muted">
        Du bist Host
        {slot && phase !== 'checkin' && ` · Check-in öffnet ${countdown(slotStart(slot).getTime() - CHECKIN_LEAD_MS - now.getTime())}`}
      </span>
    );
  } else if (inCall) {
    content = (
      <>
        <span className="joined-pill">
          <Check size={16} /> Verbindlich angemeldet
        </span>
        {phase !== 'checkin' && (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setJoining(true)}>
              Verfügbarkeit ändern
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => run(() => api.leave(post.id), 'Vom Call abgemeldet')}
            >
              Abmelden
            </button>
          </>
        )}
        {phase === 'checkin' || !slot ? null : (
          <span className="muted">Check-in öffnet {countdown(slotStart(slot).getTime() - CHECKIN_LEAD_MS - now.getTime())}</span>
        )}
      </>
    );
  } else if (post.call.finalSlot) {
    content = <span className="muted">Termin fixiert – Anmeldung geschlossen</span>;
  } else {
    content = (
      <button type="button" className="btn btn-primary" onClick={() => setJoining(true)}>
        <LogIn size={20} />
        Teilnehmen
      </button>
    );
  }

  return (
    <div className="call-actions">
      {content}
      {joining && <JoinModal post={post} onClose={() => setJoining(false)} />}
    </div>
  );
}

function countdown(ms: number): string {
  if (ms <= 0) return 'jetzt';
  const min = Math.round(ms / 60000);
  if (min < 60) return `in ${min} Min.`;
  const h = Math.round(min / 60);
  if (h < 48) return `in ${h} Std.`;
  return `in ${Math.round(h / 24)} Tagen`;
}

/**
 * Anmeldung in zwei Schritten: erst Tage, dann Uhrzeiten. Angezeigt werden
 * exakt die vom Host angebotenen Termine – inkl. bisheriger Zusagen je Slot.
 */
function JoinModal({ post, onClose }: { post: CallPost; onClose: () => void }) {
  const { me, now, run, member } = useStore();
  const existing = post.call.participants.find((p) => p.memberId === me.id);
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState(new Set<SlotKey>(existing?.availability ?? []));
  const overbook = !existing && headcount(post) >= capacity(post.call);

  const offered = useMemo(
    () => post.call.hostAvailability.filter((s) => slotStart(s).getTime() > now.getTime()),
    [post.call.hostAvailability, now],
  );
  const offeredSet = useMemo(() => new Set(offered), [offered]);
  // Zusagen der anderen (Host + übrige Teilnehmende), ohne die eigene alte Angabe.
  const others = useMemo(
    () => ({ ...post.call, participants: post.call.participants.filter((p) => p.memberId !== me.id) }),
    [post.call, me.id],
  );
  const counts = useMemo(() => slotCounts(others), [others]);
  const othersTotal = 1 + others.participants.length;
  const best = bestSlot(others, now)?.slot ?? null;

  const offeredDays = useMemo(() => new Set(offered.map((s) => s.split('|')[0])), [offered]);
  const [days, setDays] = useState(
    () => new Set([...selected].map((s) => s.split('|')[0]).filter((d) => offeredDays.has(d))),
  );
  const dayInfo = useMemo(() => {
    const info = new Map<string, { slots: number; votes: number }>();
    for (const s of offered) {
      const d = s.split('|')[0];
      const cur = info.get(d) ?? { slots: 0, votes: 0 };
      cur.slots += 1;
      cur.votes = Math.max(cur.votes, (counts.get(s) ?? 1) - 1);
      info.set(d, cur);
    }
    return info;
  }, [offered, counts]);

  const visibleSelection = [...selected].filter((s) => days.has(s.split('|')[0]) && offeredSet.has(s));

  const submit = async () => {
    const ok = await run(
      () => api.join(post.id, visibleSelection),
      existing ? 'Verfügbarkeit aktualisiert' : 'Du bist verbindlich angemeldet!',
    );
    if (ok) onClose();
  };

  return (
    <Modal title={existing ? 'Verfügbarkeit ändern' : 'Am Call teilnehmen'} onClose={onClose} wide>
      <p className="modal-lead">
        <TypeTag type="CALL" /> <strong>{post.title}</strong> mit {member(post.authorId)?.name}
      </p>
      <ol className="stepper">
        <li className={step === 1 ? 'on' : 'done'}>
          <span>{step === 2 ? <Check size={14} strokeWidth={3} /> : 1}</span> Tage wählen
        </li>
        <li className={step === 2 ? 'on' : ''}>
          <span>2</span> Uhrzeiten wählen
        </li>
      </ol>
      {overbook && (
        <div className="notice notice-warn">
          <TriangleAlert size={18} /> Dieser Call ist bereits voll. Du kannst dich trotzdem anmelden – der Host entscheidet,
          ob der Call erweitert oder dupliziert wird.
        </div>
      )}

      {step === 1 ? (
        <>
          <p className="muted">
            An welchen Tagen könntest du? Auswählbar sind alle Tage, die {member(post.authorId)?.name.split(' ')[0]}{' '}
            angeboten hat.
          </p>
          <MonthPicker available={offeredDays} selected={days} onChange={setDays} info={dayInfo} now={now} />
        </>
      ) : (
        <>
          <p className="muted">
            Wähle alle Uhrzeiten, die für dich passen – je mehr, desto besser. Die Zahl zeigt, wie viele bereits zugesagt
            haben; der beliebteste Termin ist mit „Top“ markiert.
          </p>
          <CalendarWeek
            days={[...days].sort()}
            offered={offeredSet}
            selected={selected}
            onChange={setSelected}
            counts={counts}
            total={othersTotal}
            best={best}
            now={now}
          />
        </>
      )}

      <div className="modal-actions">
        {step === 1 ? (
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary" disabled={days.size === 0} onClick={() => setStep(2)}>
              Weiter zu den Uhrzeiten <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={18} /> Tage ändern
            </button>
            <button type="button" className="btn btn-primary" disabled={visibleSelection.length === 0} onClick={submit}>
              {existing ? 'Verfügbarkeit speichern' : 'Jetzt verbindlich für den Call anmelden'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

/** Detailansicht eines Calls inkl. Heatmap und Host-Steuerung. */
export function CallModal({ post, onClose }: { post: CallPost; onClose: () => void }) {
  const { me, now, run } = useStore();
  const phase = callPhase(post, now);
  const isHost = post.authorId === me.id;
  const counts = useMemo(() => slotCounts(post.call), [post.call]);
  const best = bestSlot(post.call, now);
  const slot = effectiveSlot(post.call, now);
  const ranked = [...counts.entries()]
    .filter(([s]) => slotStart(s).getTime() > now.getTime())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const [pick, setPick] = useState<SlotKey | ''>('');

  return (
    <Modal
      title={
        <>
          <TypeTag type="CALL" /> {post.title}
        </>
      }
      onClose={onClose}
      wide
    >
      <div className="call-detail-head">
        <MemberAvatar id={post.authorId} size={56} />
        <div>
          <div className="muted">Host</div>
          <MemberName id={post.authorId} withAge />
        </div>
        <span className={`phase-pill phase-pill-${phase}`}>{PHASE_TEXT[phase]}</span>
      </div>
      {post.call.parentCallId && <p className="muted">Parallele Runde – dupliziert wegen Überbuchung.</p>}
      <p className="post-body">{post.body}</p>

      {isHost && isOverbooked(post) && (
        <div className="notice notice-warn host-panel">
          <div>
            <strong>Überbucht: {sizeLabel(post)} Personen.</strong> Wie möchtest du fortfahren?
          </div>
          <div className="row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => run(() => api.resolveOverbooking(post.id, 'expand'), 'Limit aufgehoben – alle sind dabei')}
            >
              <Expand size={18} /> Erweitern
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                run(() => api.resolveOverbooking(post.id, 'duplicate'), 'Paralleler Call für den Überhang eröffnet')
              }
            >
              <Copy size={18} /> Duplizieren
            </button>
          </div>
          <div className="muted small">
            Erweitern hebt das Limit auf. Duplizieren eröffnet einen zweiten Call mit identischem Inhalt und identischer
            Termin-Matrix für die zuletzt Angemeldeten.
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div>
          <h3>Angebotene Termine · Zusagen je Slot</h3>
          <CalendarWeek
            days={hostDays(post)}
            offered={new Set(post.call.hostAvailability)}
            selected={post.call.finalSlot ? new Set([post.call.finalSlot]) : new Set()}
            counts={counts}
            total={headcount(post)}
            best={slot}
            now={now}
          />
          <p className="muted small">
            {post.call.finalSlot
              ? `Fixierter Termin: ${formatSlot(post.call.finalSlot)}`
              : best
                ? `Bester Overlapping Slot: ${formatSlot(best.slot)} (${best.count} von ${headcount(post)} verfügbar)`
                : 'Kein zukünftiger Slot mehr verfügbar.'}
          </p>

          {isHost && phase !== 'past' && phase !== 'checkin' && (
            <div className="host-panel">
              <h3>Host-Steuerung</h3>
              {post.call.finalSlot ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => run(() => api.unfinalize(post.id), 'Terminfindung wieder geöffnet')}
                >
                  <Unlock size={18} /> Fixierung aufheben
                </button>
              ) : (
                <div className="row">
                  <select className="input" value={pick} onChange={(e) => setPick(e.target.value as SlotKey)}>
                    <option value="">Bester Slot{best ? ` – ${formatSlot(best.slot)}` : ''}</option>
                    {ranked.map(([s, c]) => (
                      <option key={s} value={s}>
                        {formatSlot(s)} · {c} verfügbar
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!best}
                    onClick={() => run(() => api.finalize(post.id, pick || undefined), 'Termin fixiert')}
                  >
                    <CalendarCheck size={18} /> Termin fixieren
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <h3>Teilnehmende · {sizeLabel(post)}</h3>
          <ul className="people-list">
            {[{ memberId: post.authorId, availability: post.call.hostAvailability, host: true }, ...post.call.participants].map(
              (p) => (
                <li key={p.memberId}>
                  <MemberAvatar id={p.memberId} size={40} />
                  <div>
                    <MemberName id={p.memberId} />
                    <div className="muted small">
                      {'host' in p ? 'Host' : `${p.availability.length} Slots`}
                      {slot && p.availability.includes(slot) ? ' · kann zum Termin' : slot ? ' · kann nicht zum Termin' : ''}
                    </div>
                  </div>
                  {post.call.checkIns.includes(p.memberId) && <span className="joined-pill">anwesend</span>}
                </li>
              ),
            )}
          </ul>
          {isInCall(post, me.id) && (
            <p className="muted small">
              {post.call.meetingProvider === 'jitsi' ? 'Jitsi-Raum (automatisch erstellt)' : 'Meeting-Link'}:{' '}
              <code>{post.call.meetingLink}</code>
            </p>
          )}
        </div>
      </div>

      <CallActions post={post} />
      <DemoJump post={post} />
    </Modal>
  );
}

/** Nur Prototyp: Uhr vorspulen, um den Check-in zu testen. */
function DemoJump({ post }: { post: CallPost }) {
  const { now, run } = useStore();
  const phase = callPhase(post, now);
  if (phase === 'past' || phase === 'checkin' || !effectiveSlot(post.call, now)) return null;
  return (
    <div className="demo-hint">
      <button
        type="button"
        className="link-btn"
        onClick={() => run(() => api.demoClock({ jumpToCheckIn: post.id }), 'Demo-Zeit: 15 Min. vor Start')}
      >
        <FastForward size={16} /> Demo: Uhr auf 15 Min. vor Start vorspulen
      </button>
    </div>
  );
}
