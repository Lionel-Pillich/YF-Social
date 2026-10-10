import {
  CircleCheck,
  Eye,
  EyeOff,
  Flag,
  History,
  LayoutDashboard,
  Lock,
  LockOpen,
  MessageSquareOff,
  Mic,
  MicOff,
  Pin,
  PinOff,
  Settings,
  ShieldCheck,
  Video,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { POST_TYPES, callPhase, headcount, isOverbooked } from '../../shared/schedule';
import type { CallCreationPolicy, Post, PostType, Report, SocialRole, SocialSettings } from '../../shared/types';
import { api } from '../api';
import { useStore } from '../store';
import { sizeLabel } from './Call';
import { MemberAvatar, MemberName, RoleBadge, StaffBadge, TypeTag, timeAgo } from './ui';

type Tab = 'overview' | 'reports' | 'posts' | 'calls' | 'members' | 'settings' | 'audit';

const ROLE_LABEL: Record<SocialRole | 'member', string> = {
  admin: 'YF Social Admin',
  moderator: 'Moderator',
  member: 'Mitglied',
};

/** YF Social Admin: Moderation, Rollen und Einstellungen. */
export function AdminView() {
  const { state, myRole } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const isAdmin = myRole === 'admin';
  const openReports = state.reports.filter((r) => r.status === 'open').length;

  const tabs: { id: Tab; label: string; icon: LucideIcon; count?: number; adminOnly?: boolean }[] = [
    { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'reports', label: 'Meldungen', icon: Flag, count: openReports },
    { id: 'posts', label: 'Beiträge', icon: MessageSquareOff },
    { id: 'calls', label: 'Calls', icon: Video },
    { id: 'members', label: 'Mitglieder & Rollen', icon: ShieldCheck },
    { id: 'settings', label: 'Einstellungen', icon: Settings, adminOnly: true },
    { id: 'audit', label: 'Protokoll', icon: History },
  ];

  return (
    <div className="admin">
      <header className="main-head">
        <div>
          <h1>YF Social Admin</h1>
          <p className="muted">
            Angemeldet als <strong>{ROLE_LABEL[myRole!]}</strong>
            {!isAdmin && ' – Rollen und Einstellungen können nur Admins ändern.'}
          </p>
        </div>
      </header>
      <nav className="admin-tabs">
        {tabs
          .filter((t) => isAdmin || !t.adminOnly)
          .map((t) => (
            <button key={t.id} type="button" className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              <t.icon size={18} /> {t.label}
              {t.count ? <span className="nav-badge">{t.count}</span> : null}
            </button>
          ))}
      </nav>
      {tab === 'overview' && <Overview onOpen={setTab} />}
      {tab === 'reports' && <Reports />}
      {tab === 'posts' && <Posts />}
      {tab === 'calls' && <Calls />}
      {tab === 'members' && <Members />}
      {tab === 'settings' && isAdmin && <SettingsForm />}
      {tab === 'audit' && <Audit />}
    </div>
  );
}

function Overview({ onOpen }: { onOpen: (t: Tab) => void }) {
  const { state, now } = useStore();
  const calls = state.posts.filter((p) => p.call);
  const stats = [
    { label: 'Beiträge', value: state.posts.length, tab: 'posts' as Tab },
    { label: 'Aktive Calls', value: calls.filter((p) => callPhase(p, now) !== 'past').length, tab: 'calls' as Tab },
    { label: 'Überbuchte Calls', value: calls.filter(isOverbooked).length, tab: 'calls' as Tab },
    { label: 'Check-ins gesamt', value: calls.reduce((n, p) => n + p.call!.checkIns.length, 0), tab: 'calls' as Tab },
    { label: 'Offene Meldungen', value: state.reports.filter((r) => r.status === 'open').length, tab: 'reports' as Tab },
    { label: 'Ausgeblendet', value: state.posts.filter((p) => p.hidden).length, tab: 'posts' as Tab },
    { label: 'Stummgeschaltet', value: state.muted.length, tab: 'members' as Tab },
    { label: 'Admins & Mods', value: Object.keys(state.roles).length, tab: 'members' as Tab },
  ];
  return (
    <>
      <div className="stat-grid">
        {stats.map((s) => (
          <button key={s.label} type="button" className="stat" onClick={() => onOpen(s.tab)}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <section className="panel">
        <h3>Letzte Aktivitäten der Moderation</h3>
        <AuditList limit={5} />
      </section>
    </>
  );
}

function reportTarget(report: Report, post: Post | undefined) {
  if (!post) return null;
  const comment = report.commentId ? post.comments.find((c) => c.id === report.commentId) : undefined;
  return { post, comment };
}

function Reports() {
  const { state, post, now, run } = useStore();
  const [showResolved, setShowResolved] = useState(false);
  const list = state.reports.filter((r) => (showResolved ? r.status !== 'open' : r.status === 'open'));

  return (
    <>
      <div className="segmented admin-seg">
        <button type="button" className={!showResolved ? 'on' : ''} onClick={() => setShowResolved(false)}>
          Offen
        </button>
        <button type="button" className={showResolved ? 'on' : ''} onClick={() => setShowResolved(true)}>
          Erledigt
        </button>
      </div>
      {list.length === 0 && <div className="empty">{showResolved ? 'Noch nichts erledigt.' : 'Keine offenen Meldungen. 🎉'}</div>}
      <div className="admin-list">
        {list.map((r) => {
          const target = reportTarget(r, post(r.postId));
          if (!target) return null;
          return (
            <article key={r.id} className="admin-card">
              <div className="admin-card-main">
                <div className="admin-card-title">
                  <TypeTag type={target.post.type} /> {target.post.title}
                  {target.post.hidden && <span className="chip">ausgeblendet</span>}
                </div>
                {target.comment && (
                  <blockquote>
                    Kommentar von <MemberName id={target.comment.authorId} />: „{target.comment.body}“
                  </blockquote>
                )}
                <div className="report-reason">
                  <Flag size={15} /> {r.reason}
                </div>
                <div className="muted small">
                  {r.reporterId ? (
                    <>
                      Gemeldet von <MemberName id={r.reporterId} />
                    </>
                  ) : (
                    'Automatische Meldung'
                  )}{' '}
                  · {timeAgo(r.at, now)} · Autor: <MemberName id={target.comment?.authorId ?? target.post.authorId} />
                  {r.resolvedBy && (
                    <>
                      {' '}
                      · {r.status === 'actioned' ? 'Ausgeblendet' : 'Verworfen'} von <MemberName id={r.resolvedBy} />
                    </>
                  )}
                </div>
              </div>
              {r.status === 'open' && (
                <div className="admin-actions">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => run(() => api.admin.resolveReport(r.id, 'actioned'), 'Inhalt ausgeblendet')}
                  >
                    <EyeOff size={16} /> Inhalt ausblenden
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => run(() => api.admin.resolveReport(r.id, 'dismissed'), 'Meldung verworfen')}
                  >
                    <XCircle size={16} /> Verwerfen
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function Posts() {
  const { state, now, run } = useStore();
  const [type, setType] = useState<PostType | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const list = state.posts.filter((p) => type === 'ALL' || p.type === type);

  return (
    <>
      <div className="filters">
        <button type="button" className={`filter ${type === 'ALL' ? 'on' : ''}`} onClick={() => setType('ALL')}>
          Alle
        </button>
        {POST_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`filter filter-${t.id.toLowerCase()} ${type === t.id ? 'on' : ''}`}
            onClick={() => setType(t.id)}
          >
            {t.prefix}
          </button>
        ))}
      </div>
      <div className="admin-list">
        {list.map((p) => (
          <article key={p.id} className={`admin-card ${p.hidden ? 'is-hidden' : ''}`}>
            <MemberAvatar id={p.authorId} size={44} />
            <div className="admin-card-main">
              <div className="admin-card-title">
                <TypeTag type={p.type} /> {p.title}
                {p.pinned && <span className="chip">angepinnt</span>}
                {p.hidden && <span className="chip">ausgeblendet</span>}
                {p.commentsLocked && <span className="chip">Kommentare gesperrt</span>}
              </div>
              <div className="muted small">
                <MemberName id={p.authorId} /> · {timeAgo(p.createdAt, now)} · {p.upvotes.length} Upvotes ·{' '}
                <button type="button" className="link-btn" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  {p.comments.length} Kommentare
                </button>
              </div>
              {expanded === p.id && (
                <ul className="admin-comments">
                  {p.comments.length === 0 && <li className="muted small">Keine Kommentare.</li>}
                  {p.comments.map((c) => (
                    <li key={c.id} className={c.hidden ? 'is-hidden' : ''}>
                      <MemberAvatar id={c.authorId} size={28} />
                      <span>
                        <MemberName id={c.authorId} />: {c.body}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          run(
                            () => api.admin.setCommentHidden(p.id, c.id, !c.hidden),
                            c.hidden ? 'Kommentar wiederhergestellt' : 'Kommentar ausgeblendet',
                          )
                        }
                      >
                        {c.hidden ? <Eye size={15} /> : <EyeOff size={15} />} {c.hidden ? 'Wiederherstellen' : 'Ausblenden'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => run(() => api.admin.updatePost(p.id, { pinned: !p.pinned }), p.pinned ? 'Gelöst' : 'Angepinnt')}
              >
                {p.pinned ? <PinOff size={16} /> : <Pin size={16} />} {p.pinned ? 'Lösen' : 'Anpinnen'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  run(
                    () => api.admin.updatePost(p.id, { commentsLocked: !p.commentsLocked }),
                    p.commentsLocked ? 'Kommentare freigegeben' : 'Kommentare gesperrt',
                  )
                }
              >
                {p.commentsLocked ? <LockOpen size={16} /> : <Lock size={16} />}{' '}
                {p.commentsLocked ? 'Kommentare frei' : 'Kommentare sperren'}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${p.hidden ? 'btn-ghost' : 'btn-danger'}`}
                onClick={() =>
                  run(() => api.admin.updatePost(p.id, { hidden: !p.hidden }), p.hidden ? 'Wiederhergestellt' : 'Ausgeblendet')
                }
              >
                {p.hidden ? <Eye size={16} /> : <EyeOff size={16} />} {p.hidden ? 'Wiederherstellen' : 'Ausblenden'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

const PHASE_TEXT = {
  open: 'Terminfindung',
  full: 'Vollzählig',
  finalized: 'Termin fixiert',
  checkin: 'Check-in offen',
  past: 'Beendet',
} as const;

function Calls() {
  const { state, now, run, openCall } = useStore();
  const calls = state.posts.filter((p): p is Post & { call: NonNullable<Post['call']> } => !!p.call);
  return (
    <div className="admin-list">
      {calls.map((p) => {
        const phase = callPhase(p, now);
        return (
          <article key={p.id} className="admin-card">
            <MemberAvatar id={p.authorId} size={44} />
            <div className="admin-card-main">
              <div className="admin-card-title">
                {p.title}
                <span className={`phase-pill phase-pill-${phase}`}>{p.call.closed ? 'Geschlossen' : PHASE_TEXT[phase]}</span>
                {isOverbooked(p) && <span className="chip chip-warn">überbucht</span>}
              </div>
              <div className="muted small">
                Host <MemberName id={p.authorId} /> · {sizeLabel(p)} Personen · {p.call.checkIns.length}/{headcount(p)}{' '}
                eingecheckt
              </div>
            </div>
            <div className="admin-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => openCall(p.id)}>
                Details
              </button>
              <button
                type="button"
                className={`btn btn-sm ${p.call.closed ? 'btn-ghost' : 'btn-danger'}`}
                onClick={() =>
                  run(() => api.admin.closeCall(p.id, !!p.call.closed), p.call.closed ? 'Call wieder geöffnet' : 'Call geschlossen')
                }
              >
                {p.call.closed ? 'Wieder öffnen' : 'Call schließen'}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Members() {
  const { state, me, myRole, run } = useStore();
  const isAdmin = myRole === 'admin';
  const [query, setQuery] = useState('');
  const members = state.members.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <input
        className="input admin-search"
        placeholder="Mitglied suchen …"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <table className="admin-table">
        <thead>
          <tr>
            <th>Mitglied</th>
            <th>Chapter</th>
            <th>Karma</th>
            <th>Rolle in YF Social</th>
            <th>Schreibrechte</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const role = state.roles[m.id];
            const muted = state.muted.includes(m.id);
            return (
              <tr key={m.id}>
                <td>
                  <div className="row">
                    <MemberAvatar id={m.id} size={40} />
                    <div>
                      <MemberName id={m.id} withAge /> <StaffBadge id={m.id} />
                      <div>
                        <RoleBadge role={m.role} />
                      </div>
                    </div>
                  </div>
                </td>
                <td>{m.chapter ?? '–'}</td>
                <td>{state.karma[m.id] ?? 0}</td>
                <td>
                  {isAdmin ? (
                    <select
                      className="input input-sm"
                      value={role ?? 'member'}
                      onChange={(e) =>
                        run(
                          () => api.admin.setRole(m.id, e.target.value as SocialRole | 'member'),
                          `${m.name} ist jetzt ${ROLE_LABEL[e.target.value as SocialRole | 'member']}`,
                        )
                      }
                    >
                      <option value="member">Mitglied</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">YF Social Admin</option>
                    </select>
                  ) : (
                    ROLE_LABEL[role ?? 'member']
                  )}
                  {m.id === me.id && <span className="muted small"> (du)</span>}
                </td>
                <td>
                  {role ? (
                    <span className="muted small">–</span>
                  ) : (
                    <button
                      type="button"
                      className={`btn btn-sm ${muted ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={() =>
                        run(() => api.admin.setMuted(m.id, !muted), muted ? `${m.name} freigeschaltet` : `${m.name} stummgeschaltet`)
                      }
                    >
                      {muted ? <MicOff size={15} /> : <Mic size={15} />} {muted ? 'Stumm – freischalten' : 'Stummschalten'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="role-help">
        <div>
          <strong>YF Social Admin</strong>
          <span>Alles inkl. Rollen vergeben und Einstellungen ändern.</span>
        </div>
        <div>
          <strong>Moderator</strong>
          <span>Meldungen bearbeiten, Beiträge & Kommentare ausblenden, anpinnen, Calls schließen, Mitglieder stummschalten.</span>
        </div>
        <div>
          <strong>Stummgeschaltet</strong>
          <span>Kann lesen und upvoten, aber nicht posten, kommentieren oder Calls beitreten.</span>
        </div>
      </div>
    </>
  );
}

function SettingsForm() {
  const { state, run } = useStore();
  const [draft, setDraft] = useState<SocialSettings>(() => structuredClone(state.settings));
  const [words, setWords] = useState(state.settings.wordFilter.join(', '));
  const dirty =
    JSON.stringify({ ...draft, wordFilter: [] }) !== JSON.stringify({ ...state.settings, wordFilter: [] }) ||
    words !== state.settings.wordFilter.join(', ');

  const toggleType = (t: PostType) =>
    setDraft((d) => ({
      ...d,
      enabledTypes: d.enabledTypes.includes(t) ? d.enabledTypes.filter((x) => x !== t) : [...d.enabledTypes, t],
    }));

  const save = () =>
    run(
      () =>
        api.admin.updateSettings({
          ...draft,
          wordFilter: words
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean),
        }),
      'Einstellungen gespeichert',
    );

  const num = (key: 'karmaHost' | 'karmaCheckin' | 'checkinLeadMin', label: string, suffix: string) => (
    <label className="field">
      <span>{label}</span>
      <div className="row">
        <input
          type="number"
          className="input input-num"
          value={draft[key]}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))}
        />
        <span className="muted">{suffix}</span>
      </div>
    </label>
  );

  return (
    <div className="settings">
      <section className="panel">
        <h3>Beitragsarten</h3>
        <p className="muted small">Deaktivierte Arten können nicht mehr neu erstellt werden; bestehende Beiträge bleiben.</p>
        <div className="check-grid">
          {POST_TYPES.map((t) => (
            <label key={t.id} className="check">
              <input type="checkbox" checked={draft.enabledTypes.includes(t.id)} onChange={() => toggleType(t.id)} />
              <TypeTag type={t.id} /> {t.hint}
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Wer darf Calls erstellen?</h3>
        <div className="radio-list">
          {(
            [
              ['all', 'Alle Mitglieder'],
              ['founders', 'Nur Founder (sowie Admins & Moderatoren)'],
              ['staff', 'Nur Admins & Moderatoren'],
            ] as [CallCreationPolicy, string][]
          ).map(([id, label]) => (
            <label key={id} className="radio">
              <input
                type="radio"
                name="callCreation"
                checked={draft.callCreation === id}
                onChange={() => setDraft((d) => ({ ...d, callCreation: id }))}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Karma & Check-in</h3>
        <div className="settings-row">
          {num('karmaHost', 'Karma fürs Hosten eines Calls', 'Punkte')}
          {num('karmaCheckin', 'Karma pro Check-in', 'Punkte')}
          {num('checkinLeadMin', 'Check-in öffnet vor Start', 'Minuten')}
        </div>
        <p className="muted small">Änderungen gelten für neue Karma-Vergaben; bereits vergebene Punkte bleiben bestehen.</p>
      </section>

      <section className="panel">
        <h3>Wortfilter</h3>
        <p className="muted small">
          Beiträge und Kommentare mit diesen Begriffen werden nicht blockiert, sondern automatisch in die Meldungen gelegt.
          Begriffe mit Komma trennen.
        </p>
        <textarea className="input" rows={3} value={words} onChange={(e) => setWords(e.target.value)} />
      </section>

      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!dirty}
          onClick={() => {
            setDraft(structuredClone(state.settings));
            setWords(state.settings.wordFilter.join(', '));
          }}
        >
          Verwerfen
        </button>
        <button type="button" className="btn btn-primary" disabled={!dirty} onClick={save}>
          <CircleCheck size={18} /> Speichern
        </button>
      </div>
    </div>
  );
}

function Audit() {
  return (
    <section className="panel">
      <AuditList />
    </section>
  );
}

function AuditList({ limit }: { limit?: number }) {
  const { state, now } = useStore();
  const entries = limit ? state.audit.slice(0, limit) : state.audit;
  if (entries.length === 0) return <p className="muted small">Noch keine Einträge.</p>;
  return (
    <ul className="audit">
      {entries.map((e) => (
        <li key={e.id}>
          <MemberAvatar id={e.actorId} size={32} />
          <span>
            <MemberName id={e.actorId} /> {e.text}
          </span>
          <span className="muted small">{timeAgo(e.at, now)}</span>
        </li>
      ))}
    </ul>
  );
}
