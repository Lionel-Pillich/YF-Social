import { Coins, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { POST_TYPES } from '../../shared/schedule';
import type { Member, PostType } from '../../shared/types';
import { useStore } from '../store';

export function Avatar({ member, size = 48, onClick }: { member: Member; size?: number; onClick?: () => void }) {
  const initials = member.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  // Ohne Foto: Initialen auf einer pro Person stabilen Farbe.
  const hue = [...member.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const style = {
    width: size,
    height: size,
    fontSize: size * 0.36,
    ...(member.photo ? {} : { background: `hsl(${hue} 45% 32%)` }),
  };
  const content = member.photo ? <img src={member.photo} alt={member.name} /> : <span>{initials}</span>;
  // Ohne Klick-Aktion als <span>, damit Avatare auch in Buttons stehen dürfen.
  if (!onClick) {
    return (
      <span className="avatar" style={style} title={member.name}>
        {content}
      </span>
    );
  }
  return (
    <button type="button" className="avatar" style={style} onClick={onClick} title={member.name}>
      {content}
    </button>
  );
}

/** Avatar, der das Profil öffnet. */
export function MemberAvatar({ id, size }: { id: string; size?: number }) {
  const { member, openProfile } = useStore();
  const m = member(id);
  if (!m) return null;
  return <Avatar member={m} size={size} onClick={() => openProfile(id)} />;
}

export function MemberName({ id, withAge = false }: { id: string; withAge?: boolean }) {
  const { member, openProfile } = useStore();
  const m = member(id);
  if (!m) return null;
  return (
    <button type="button" className="member-name" onClick={() => openProfile(id)}>
      {m.name}
      {withAge && m.age ? ` (${m.age})` : ''}
    </button>
  );
}

export function RoleBadge({ role }: { role?: Member['role'] }) {
  if (!role) return null;
  return <span className={`badge badge-${role.toLowerCase()}`}>{role}</span>;
}

/** Kennzeichnung für YF Social Admins & Moderatoren. */
export function StaffBadge({ id }: { id: string }) {
  const { state } = useStore();
  const role = state.roles[id];
  if (!role) return null;
  return <span className={`staff-badge staff-${role}`}>{role === 'admin' ? 'Admin' : 'Mod'}</span>;
}

/** Kleiner Karma-Hinweis mit Münzsymbol, z. B. „+20 Karma“. */
export function KarmaHint({ points, label }: { points: number; label?: string }) {
  return (
    <span className="karma-hint" title="Karma-Punkte">
      <Coins size={14} strokeWidth={2.4} />
      {label ?? `+${points} Karma`}
    </span>
  );
}

export function TypeTag({ type }: { type: PostType }) {
  const t = POST_TYPES.find((x) => x.id === type)!;
  return <span className={`type-tag type-${type.toLowerCase()}`}>{t.prefix}</span>;
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Schließen">
            <X size={22} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function timeAgo(iso: string, now: Date): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'vor 1 Tag' : `vor ${d} Tagen`;
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
