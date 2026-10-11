import { Bell, Clock, Flame, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { POST_TYPES } from '../shared/schedule';
import type { Post, PostType } from '../shared/types';
import { api } from './api';
import { AdminView } from './components/Admin';
import { CallModal } from './components/Call';
import { Composer } from './components/Composer';
import { PostCard } from './components/PostCard';
import { ProfileModal } from './components/Profile';
import { RightRail } from './components/RightRail';
import { Sidebar } from './components/Sidebar';
import { StoryBar } from './components/StoryBar';
import { Toasts, timeAgo } from './components/ui';
import { useStore } from './store';

type Sort = 'new' | 'top';

/** Gewichtung: Upvotes, abgeschwächt durch das Alter (Hacker-News-artig). */
function score(post: Post, now: Date): number {
  const hours = (now.getTime() - new Date(post.createdAt).getTime()) / 3_600_000;
  return (post.upvotes.length + post.comments.length * 0.5 + 1) / Math.pow(hours + 2, 0.8);
}

export function App() {
  const { state, me, member, now, profileId, openProfile, callId, openCall, post, view } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PostType | 'ALL'>('ALL');
  const [sort, setSort] = useState<Sort>('new');
  const [composer, setComposer] = useState<PostType | null>(null);

  const posts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.posts.filter((p) => {
      // Ausgeblendete Beiträge erscheinen nur für ihre Autor:innen (mit Hinweis).
      if (p.hidden && p.authorId !== me.id) return false;
      if (filter !== 'ALL' && p.type !== filter) return false;
      if (!q) return true;
      const author = member(p.authorId);
      return [p.title, p.body, author?.name, author?.location, author?.companies.map((c) => c.name).join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    list.sort(sort === 'new' ? (a, b) => b.createdAt.localeCompare(a.createdAt) : (a, b) => score(b, now) - score(a, now));
    // Angepinnte Beiträge stehen immer oben.
    return [...list.filter((p) => p.pinned), ...list.filter((p) => !p.pinned)];
  }, [state.posts, filter, query, sort, member, now, me.id]);

  const openCallPost = callId ? post(callId) : undefined;

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        {import.meta.env.VITE_LOCAL_API === '1' && (
          <div className="demo-banner">
            <strong>Prototyp</strong> mit fiktiven Demo-Daten. Alles, was du tust, wird nur in deinem Browser gespeichert –
            zum Zurücksetzen rechts „Daten zurücksetzen“.
          </div>
        )}
        {view === 'admin' ? (
          <AdminView />
        ) : (
          <>
        <header className="main-head">
          <h1>YF Social</h1>
          <div className="row">
            <Notifications />
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setComposer('DISCUSS')}>
              <Plus size={22} /> Beitrag erstellen
            </button>
          </div>
        </header>

        <StoryBar onCreateCall={() => setComposer('CALL')} />

        <div className="toolbar">
          <input
            className="input search"
            placeholder="Beiträge, Mitglieder oder Startups suchen …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="segmented" role="tablist">
            <button type="button" className={sort === 'new' ? 'on' : ''} onClick={() => setSort('new')}>
              <Clock size={18} /> Neu
            </button>
            <button type="button" className={sort === 'top' ? 'on' : ''} onClick={() => setSort('top')}>
              <Flame size={18} /> Top
            </button>
          </div>
        </div>
        <div className="filters">
          <button type="button" className={`filter ${filter === 'ALL' ? 'on' : ''}`} onClick={() => setFilter('ALL')}>
            Alle
          </button>
          {POST_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`filter filter-${t.id.toLowerCase()} ${filter === t.id ? 'on' : ''}`}
              onClick={() => setFilter(t.id)}
            >
              {t.prefix}
            </button>
          ))}
        </div>
        <div className="count">
          {posts.length} von {state.posts.length} Beiträgen
        </div>

        <div className="content">
          <section className="feed">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            {posts.length === 0 && <div className="empty">Keine Beiträge gefunden.</div>}
          </section>
          <RightRail />
        </div>
          </>
        )}
      </main>

      {composer && <Composer initialType={composer} onClose={() => setComposer(null)} />}
      {openCallPost?.call && (
        <CallModal post={openCallPost as Post & { call: NonNullable<Post['call']> }} onClose={() => openCall(null)} />
      )}
      {profileId && <ProfileModal id={profileId} onClose={() => openProfile(null)} />}
      <Toasts />
    </div>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const { state, now, run, post, openCall } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <div className="notif-wrap">
      <button
        type="button"
        className="btn btn-outline btn-icon"
        aria-label="Benachrichtigungen"
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread) void run(() => api.readNotifications());
        }}
      >
        <Bell size={22} />
        {unread > 0 && <span className="dot">{unread}</span>}
      </button>
      {open && (
        <div className="notif-menu">
          {state.notifications.length === 0 && <p className="muted small">Keine Benachrichtigungen.</p>}
          {state.notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`notif notif-${n.kind}`}
              onClick={() => {
                setOpen(false);
                if (n.postId && post(n.postId)?.call) openCall(n.postId);
              }}
            >
              <span>{n.text}</span>
              <span className="muted small">{timeAgo(n.at, now)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
