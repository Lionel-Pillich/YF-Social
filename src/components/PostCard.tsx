import { ArrowBigUp, EyeOff, Flag, Lock, MapPin, MessageCircle, Pin, Send } from 'lucide-react';
import { useState } from 'react';
import type { Post } from '../../shared/types';
import { api } from '../api';
import { useStore } from '../store';
import { CallSummary } from './Call';
import { MemberAvatar, MemberName, Modal, RoleBadge, StaffBadge, TypeTag, timeAgo } from './ui';

export function PostCard({ post }: { post: Post }) {
  const { me, member, now, run, state } = useStore();
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');
  const [reporting, setReporting] = useState(false);
  const author = member(post.authorId)!;
  const upvoted = post.upvotes.includes(me.id);
  const visibleComments = post.comments.filter((c) => !c.hidden).length;

  const submitComment = async () => {
    if (!draft.trim()) return;
    if (await run(() => api.comment(post.id, draft))) setDraft('');
  };

  return (
    <article className={`post post-${post.type.toLowerCase()} ${post.pinned ? 'post-pinned' : ''}`}>
      {post.pinned && (
        <div className="post-flag">
          <Pin size={15} /> Angepinnt von der Moderation
        </div>
      )}
      {post.hidden && (
        <div className="post-flag post-flag-hidden">
          <EyeOff size={15} /> Von der Moderation ausgeblendet – nur für dich sichtbar
        </div>
      )}
      <header className="post-head">
        <MemberAvatar id={author.id} size={64} />
        <div className="post-author">
          <MemberName id={author.id} withAge /> <StaffBadge id={author.id} />
          <div className="post-meta">
            {author.location && (
              <span>
                <MapPin size={15} /> {author.location}
              </span>
            )}
            <span>Karma {state.karma[author.id] ?? 0}</span>
            <span>{timeAgo(post.createdAt, now)}</span>
          </div>
        </div>
        <RoleBadge role={author.role} />
      </header>

      <h3 className="post-title">
        <TypeTag type={post.type} /> {post.title}
      </h3>
      {post.body && <p className="post-body">{post.body}</p>}

      {post.call && <CallSummary post={post as Post & { call: NonNullable<Post['call']> }} />}

      <footer className="post-foot">
        <button
          type="button"
          className={`vote ${upvoted ? 'vote-on' : ''}`}
          onClick={() => run(() => api.upvote(post.id))}
          aria-pressed={upvoted}
        >
          <ArrowBigUp size={22} fill={upvoted ? 'currentColor' : 'none'} />
          {post.upvotes.length}
        </button>
        <button type="button" className="vote" onClick={() => setShowComments((s) => !s)}>
          <MessageCircle size={20} />
          {visibleComments} {visibleComments === 1 ? 'Kommentar' : 'Kommentare'}
        </button>
        {post.authorId !== me.id && (
          <button type="button" className="vote vote-subtle" onClick={() => setReporting(true)} title="Beitrag melden">
            <Flag size={17} /> Melden
          </button>
        )}
      </footer>
      {reporting && <ReportModal postId={post.id} title={post.title} onClose={() => setReporting(false)} />}

      {showComments && (
        <div className="comments">
          {post.comments.filter((c) => !c.hidden).map((c) => (
            <div key={c.id} className="comment">
              <MemberAvatar id={c.authorId} size={32} />
              <div>
                <div>
                  <MemberName id={c.authorId} /> <span className="muted small">{timeAgo(c.createdAt, now)}</span>
                </div>
                <p>{c.body}</p>
              </div>
            </div>
          ))}
          {post.commentsLocked ? (
            <p className="muted small">
              <Lock size={14} /> Kommentare wurden von der Moderation gesperrt.
            </p>
          ) : (
          <form
            className="comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              void submitComment();
            }}
          >
            <input
              className="input"
              placeholder="Kommentar schreiben …"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn btn-ghost" disabled={!draft.trim()} aria-label="Senden">
              <Send size={18} />
            </button>
          </form>
          )}
        </div>
      )}
    </article>
  );
}

const REPORT_REASONS = [
  'Spam oder Werbung',
  'Falsche Beitragsart',
  'Unangemessener Inhalt',
  'Falschinformation',
  'Verstößt gegen die Community-Regeln',
];

function ReportModal({ postId, title, onClose }: { postId: string; title: string; onClose: () => void }) {
  const { run } = useStore();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [note, setNote] = useState('');
  const submit = async () => {
    const text = note.trim() ? `${reason}: ${note.trim()}` : reason;
    if (await run(() => api.report(postId, text), 'Danke! Die Moderation schaut sich das an.')) onClose();
  };
  return (
    <Modal title="Beitrag melden" onClose={onClose}>
      <p className="modal-lead">„{title}“</p>
      <div className="radio-list">
        {REPORT_REASONS.map((r) => (
          <label key={r} className="radio">
            <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
            {r}
          </label>
        ))}
      </div>
      <label className="field">
        <span>Anmerkung (optional)</span>
        <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-primary" onClick={submit}>
          Melden
        </button>
      </div>
    </Modal>
  );
}
