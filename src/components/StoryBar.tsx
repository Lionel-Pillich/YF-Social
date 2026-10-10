import { Plus } from 'lucide-react';
import { callPhase, effectiveSlot, formatSlot, headcount, maxGroupSize } from '../../shared/schedule';
import { useStore } from '../store';
import { Avatar } from './ui';

const PHASE_LABEL = {
  open: 'Sucht Teilnehmende',
  full: 'Vollzählig',
  finalized: 'Termin fixiert',
  checkin: 'Check-in offen',
  past: 'Vorbei',
} as const;

/** Horizontale Story-Leiste mit allen CALL-Beiträgen. */
export function StoryBar({ onCreateCall }: { onCreateCall: () => void }) {
  const { state, now, member, openCall } = useStore();
  const calls = state.posts
    .filter((p) => p.call)
    .map((p) => ({ post: p, phase: callPhase(p, now) }))
    // Aktive zuerst, dann nach Termin.
    .sort((a, b) => {
      const rank = (x: typeof a) => (x.phase === 'open' ? 0 : x.phase === 'past' ? 2 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      const sa = effectiveSlot(a.post.call!, now) ?? '';
      const sb = effectiveSlot(b.post.call!, now) ?? '';
      return rank(a) === 2 ? sb.localeCompare(sa) : sa.localeCompare(sb);
    });

  return (
    <div className="stories" role="list">
      <button type="button" className="story story-new" onClick={onCreateCall}>
        <span className="story-ring">
          <span className="story-plus">
            <Plus size={30} />
          </span>
        </span>
        <span className="story-title">Call starten</span>
      </button>
      {calls.map(({ post, phase }) => {
        const host = member(post.authorId)!;
        const slot = effectiveSlot(post.call!, now);
        const active = phase === 'open';
        return (
          <button
            key={post.id}
            type="button"
            role="listitem"
            className={`story ${active ? 'story-active' : 'story-inactive'} ${phase === 'checkin' ? 'story-live' : ''}`}
            onClick={() => openCall(post.id)}
            title={`${post.title} · ${PHASE_LABEL[phase]}${slot ? ` · ${formatSlot(slot)}` : ''}`}
          >
            <span className="story-ring">
              <Avatar member={host} size={68} />
            </span>
            <span className="story-title">{post.title}</span>
            <span className="story-meta">
              {phase === 'checkin'
                ? 'Jetzt live'
                : `${headcount(post)}/${post.call!.capacityExpanded ? '∞' : maxGroupSize(post.call!.groupSize)} · ${PHASE_LABEL[phase]}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
