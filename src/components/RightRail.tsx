import { Award, Coins, FastForward, RotateCcw, Trophy } from 'lucide-react';
import { callPhase, effectiveSlot, formatSlot, isInCall } from '../../shared/schedule';
import { api } from '../api';
import { useStore } from '../store';
import { KARMA_ITEMS } from '../../shared/karma';
import { MemberAvatar, MemberName, TypeTag } from './ui';

const DAY = 24 * 60 * 60 * 1000;

export function RightRail() {
  const { state, me, now, openCall, run } = useStore();

  const leaderboard = state.members
    .map((m) => ({ id: m.id, karma: state.karma[m.id] ?? 0 }))
    .sort((a, b) => b.karma - a.karma)
    .slice(0, 6);

  const myCalls = state.posts
    .filter((p) => p.call && isInCall(p, me.id) && callPhase(p, now) !== 'past')
    .sort((a, b) => (effectiveSlot(a.call!, now) ?? '').localeCompare(effectiveSlot(b.call!, now) ?? ''));

  return (
    <aside className="rail">
      <section className="panel">
        <h3>Meine Calls</h3>
        {myCalls.length === 0 && <p className="muted small">Du bist aktuell für keinen Call angemeldet.</p>}
        <ul className="rail-list">
          {myCalls.map((p) => {
            const slot = effectiveSlot(p.call!, now);
            const phase = callPhase(p, now);
            return (
              <li key={p.id}>
                <button type="button" className="rail-call" onClick={() => openCall(p.id)}>
                  <span className="rail-call-title">{p.title}</span>
                  <span className={`small ${phase === 'checkin' ? 'live' : 'muted'}`}>
                    {phase === 'checkin' ? '● Check-in offen' : slot ? formatSlot(slot) : '–'}
                    {p.authorId === me.id && ' · Host'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h3>
          <Trophy size={18} /> Karma-Rangliste
        </h3>
        <ol className="leaderboard">
          {leaderboard.map((e, i) => (
            <li key={e.id}>
              <span className="rank">{i + 1}</span>
              <MemberAvatar id={e.id} size={36} />
              <MemberName id={e.id} />
              <strong>{e.karma}</strong>
            </li>
          ))}
        </ol>
        <div className="award">
          <Award size={28} strokeWidth={1.8} />
          <div>
            <strong>YF Social Award</strong>
            <span>Platz 1 der Rangliste wird einmal im Jahr geehrt und erhält den YF Social Award.</span>
          </div>
        </div>
        <h4 className="karma-how">
          <Coins size={16} /> So sammelst du Karma
        </h4>
        <ul className="karma-rates">
          {KARMA_ITEMS.map((k, i) => (
            <li key={k.key} className={i < 2 ? 'is-top' : ''}>
              <span>{k.short}</span>
              <strong>+{state.settings.karma[k.key]}</strong>
            </li>
          ))}
        </ul>
        <p className="muted small">Calls bringen die meisten Punkte, weil sie echte Interaktion im Netzwerk schaffen. Keine Abzüge bei Nichterscheinen.</p>
      </section>

      <section className="panel">
        <h3>Beitragsarten</h3>
        <ul className="legend">
          <li>
            <TypeTag type="CALL" /> Live-Austausch mit Terminfindung
          </li>
          <li>
            <TypeTag type="DISCUSS" /> Diskussionen & Debatten
          </li>
          <li>
            <TypeTag type="LEARNING" /> Playbooks & Post-Mortems
          </li>
          <li>
            <TypeTag type="ASK" /> Fragen an die Community
          </li>
          <li>
            <TypeTag type="SHOW" /> MVPs & Meilensteine
          </li>
        </ul>
      </section>

      <section className="panel panel-demo">
        <h3>Prototyp-Werkzeuge</h3>
        <p className="muted small">
          Demo-Zeit: {now.toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          {state.clockOffsetMs !== 0 && ' (verschoben)'}
        </p>
        <div className="row wrap">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => run(() => api.demoClock({ addMs: DAY }), 'Uhr +1 Tag')}>
            <FastForward size={16} /> +1 Tag
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => run(() => api.demoClock({ addMs: 2 * 60 * 60 * 1000 }), 'Uhr +2 Std.')}
          >
            <FastForward size={16} /> +2 Std.
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => run(() => api.demoClock({ reset: true }), 'Echtzeit')}>
            Echtzeit
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (confirm('Alle Demo-Daten auf den Ausgangszustand zurücksetzen?')) {
                void run(() => api.demoReset(), 'Demo-Daten zurückgesetzt');
              }
            }}
          >
            <RotateCcw size={16} /> Daten zurücksetzen
          </button>
        </div>
        <p className="muted small">Perspektive wechseln: unten links auf dein Profil klicken.</p>
      </section>
    </aside>
  );
}
