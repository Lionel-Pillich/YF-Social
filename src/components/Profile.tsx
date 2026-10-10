import { Building2, MapPin, Sparkles, Users } from 'lucide-react';
import { callPhase } from '../../shared/schedule';
import { useStore } from '../store';
import { Avatar, Modal, RoleBadge, TypeTag } from './ui';

/** YFN Member-Profil inkl. YF-Social-Aktivität und Karma. */
export function ProfileModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { member, state, now, openCall } = useStore();
  const m = member(id);
  if (!m) return null;

  const posts = state.posts.filter((p) => p.authorId === id);
  const hosted = posts.filter((p) => p.call).length;
  const checkIns = state.karmaEvents.filter((e) => e.memberId === id && e.reason === 'call_checkin').length;
  const upcoming = state.posts.filter(
    (p) => p.call?.participants.some((x) => x.memberId === id) && callPhase(p, now) !== 'past',
  );

  return (
    <Modal title="Mitglied" onClose={onClose} wide>
      <div className="profile">
        <div className="profile-card">
          <div className="profile-photo">
            <Avatar member={m} size={220} />
          </div>
          <div className="profile-main">
            <h2>
              {m.name}
              {m.age ? ` (${m.age})` : ''}
            </h2>
            <div className="profile-meta">
              {m.location && (
                <span>
                  <MapPin size={18} /> {m.location}
                </span>
              )}
              {m.chapter && (
                <span>
                  <Users size={18} /> Chapter {m.chapter}
                </span>
              )}
              {m.program && <span className="chip">{m.program}</span>}
              <RoleBadge role={m.role} />
            </div>
            {m.bio ? <p>{m.bio}</p> : <p className="muted">Dieses Profil ist noch nicht ausgefüllt.</p>}
            {m.areas.length > 0 && (
              <div className="chips">
                <span className="muted">Bereiche:</span>
                {m.areas.map((a) => (
                  <span key={a} className="chip">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="karma-strip">
          <div>
            <Sparkles size={20} />
            <strong>{state.karma[id] ?? 0}</strong>
            <span>Karma</span>
          </div>
          <div>
            <strong>{hosted}</strong>
            <span>Calls gehostet</span>
          </div>
          <div>
            <strong>{checkIns}</strong>
            <span>Check-ins</span>
          </div>
          <div>
            <strong>{posts.length}</strong>
            <span>Beiträge</span>
          </div>
        </div>

        {m.companies.map((c) => (
          <section key={c.name} className="company">
            <h3>
              <Building2 size={20} /> {c.name}
            </h3>
            <p>{c.tagline}</p>
            <div className="company-facts">
              {c.stage && (
                <div>
                  <span className="fact-label">Phase</span>
                  {c.stage}
                </div>
              )}
              {c.industry && (
                <div>
                  <span className="fact-label">Branche</span>
                  {c.industry}
                </div>
              )}
            </div>
            {(c.problem || c.solution || c.vision) && (
              <div className="company-psv">
                {c.problem && (
                  <div>
                    <span className="fact-label">Problem</span>
                    {c.problem}
                  </div>
                )}
                {c.solution && (
                  <div>
                    <span className="fact-label">Lösung</span>
                    {c.solution}
                  </div>
                )}
                {c.vision && (
                  <div>
                    <span className="fact-label">Vision</span>
                    {c.vision}
                  </div>
                )}
              </div>
            )}
          </section>
        ))}

        {(posts.length > 0 || upcoming.length > 0) && (
          <section>
            <h3>Aktivität in YF Social</h3>
            <ul className="activity">
              {upcoming.map((p) => (
                <li key={`u-${p.id}`}>
                  <button type="button" className="link-btn" onClick={() => openCall(p.id)}>
                    <TypeTag type="CALL" /> {p.title}
                  </button>
                  <span className="muted small">angemeldet</span>
                </li>
              ))}
              {posts.map((p) => (
                <li key={p.id}>
                  {p.call ? (
                    <button type="button" className="link-btn" onClick={() => openCall(p.id)}>
                      <TypeTag type={p.type} /> {p.title}
                    </button>
                  ) : (
                    <span>
                      <TypeTag type={p.type} /> {p.title}
                    </span>
                  )}
                  <span className="muted small">{p.upvotes.length} Upvotes</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
}
