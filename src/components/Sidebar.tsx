import {
  ArrowLeftRight,
  Briefcase,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  Ellipsis,
  Gavel,
  GraduationCap,
  HandHeart,
  LayoutGrid,
  MessagesSquare,
  Rocket,
  ShieldUser,
  Sprout,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useStore, type View } from '../store';
import { Avatar } from './ui';

interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Gesetzt = klickbarer Eintrag des Prototyps. */
  view?: View;
}

/**
 * Nachbau der Sidebar aus apps/member. Nur „YF Social“ und (für Admins &
 * Moderatoren) „YF Social Admin“ sind aktiv – alle anderen Einträge sind
 * reine Platzhalter ohne Funktion.
 */
export function Sidebar() {
  const { state, isStaff, state: { reports } } = useStore();
  const openReports = reports.filter((r) => r.status === 'open').length;
  const general: NavItem[] = [
    { label: 'Dashboard', icon: LayoutGrid },
    { label: `Mitglieder (${state.totalMembers})`, icon: Users },
    { label: 'Unternehmen', icon: Rocket },
    { label: 'Benefits', icon: Store },
    { label: 'Jobs', icon: Briefcase },
    { label: 'YF Social', icon: MessagesSquare, view: 'social' },
    { label: 'Mentoring', icon: GraduationCap },
  ];
  const admin: NavItem[] = [
    { label: 'Member', icon: ShieldUser },
    ...(isStaff ? [{ label: 'YF Social Admin', icon: Gavel, view: 'admin' as const }] : []),
    { label: 'Chapter', icon: HandHeart },
    { label: 'Scheduling', icon: CalendarDays },
    { label: 'Migration', icon: ArrowLeftRight },
    { label: 'Analysen', icon: ChartNoAxesCombined },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <YfnLogo />
        <span className="nav-disabled" aria-hidden>
          <Ellipsis size={24} />
        </span>
      </div>
      <nav>
        <NavLink item={{ label: 'Incubator', icon: Sprout }} />
        <SectionLabel>Allgemein</SectionLabel>
        {general.map((i) => (
          <NavLink key={i.label} item={i} />
        ))}
        <SectionLabel>Admin</SectionLabel>
        {admin.map((i) => (
          <NavLink key={i.label} item={i} badge={i.view === 'admin' ? openReports : 0} />
        ))}
      </nav>
      <UserBox />
    </aside>
  );
}

function NavLink({ item, badge = 0 }: { item: NavItem; badge?: number }) {
  const { view, setView } = useStore();
  const Icon = item.icon;
  if (!item.view) {
    return (
      <div className="nav-item nav-disabled" aria-disabled>
        <Icon size={24} strokeWidth={1.8} />
        <span>{item.label}</span>
      </div>
    );
  }
  const active = view === item.view;
  return (
    <button
      type="button"
      className={`nav-item nav-link ${active ? 'active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={() => setView(item.view!)}
    >
      <Icon size={24} strokeWidth={1.8} />
      <span>{item.label}</span>
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="nav-section">
      <span>{children}</span>
      <i />
    </div>
  );
}

function YfnLogo() {
  return <img className="logo" src="/yfn-logo.png" alt="YFN" />;
}

/** Profil-Box unten links. Im Prototyp zum Wechseln der Demo-Perspektive. */
function UserBox() {
  const { me, state, switchUser } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <div className="userbox-wrap">
      {open && (
        <div className="user-menu">
          <div className="user-menu-title">Demo: Ansicht wechseln</div>
          {state.members.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`user-menu-item ${m.id === me.id ? 'current' : ''}`}
              onClick={() => {
                setOpen(false);
                void switchUser(m.id);
              }}
            >
              <Avatar member={m} size={28} />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="userbox" onClick={() => setOpen((o) => !o)}>
        <Avatar member={me} size={48} />
        <span>{me.name}</span>
        <ChevronDown size={18} className="userbox-chevron" />
      </button>
    </div>
  );
}
