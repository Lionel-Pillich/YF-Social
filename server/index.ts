import express, { type NextFunction, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import {
  BLOCKS,
  CHECKIN_LEAD_MS,
  GROUP_SIZES,
  POST_TYPES,
  callPhase,
  capacity,
  effectiveSlot,
  formatSlot,
  headcount,
  isInCall,
  isOverbooked,
  matrixDays,
  setCheckinLead,
  slotStart,
} from '../shared/schedule';
import type {
  Bootstrap,
  KarmaEvent,
  NewPostInput,
  Notification,
  Post,
  Report,
  SlotKey,
  SocialRole,
  SocialSettings,
} from '../shared/types';
import { getDb, loadDb, now, resetDb, saveDb } from './db';
import { CURRENT_USER_ID } from './members';

const PORT = Number(process.env.API_PORT ?? 3001);
/** Gesamtzahl der Plattform-Mitglieder laut Sidebar („Mitglieder (1677)“). */
const TOTAL_MEMBERS = 1677;

loadDb();

const app = express();
app.use(express.json());
app.use('/media/members', express.static(path.resolve(import.meta.dirname, '../member/bilder')));

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Prototyp ohne Login: Die Ansicht wird über den Header `x-user-id` gewählt. */
function viewer(req: Request): string {
  const id = req.header('x-user-id') ?? CURRENT_USER_ID;
  if (!getDb().members.some((m) => m.id === id)) throw new HttpError(401, 'Unbekanntes Mitglied');
  return id;
}

function findPost(id: string): Post {
  const post = getDb().posts.find((p) => p.id === id);
  if (!post) throw new HttpError(404, 'Beitrag nicht gefunden');
  return post;
}

function findCall(id: string): Post & { call: NonNullable<Post['call']> } {
  const post = findPost(id);
  if (!post.call) throw new HttpError(400, 'Beitrag ist kein Call');
  return post as Post & { call: NonNullable<Post['call']> };
}

function memberName(id: string): string {
  return getDb().members.find((m) => m.id === id)?.name ?? 'Jemand';
}

function notify(memberId: string, kind: Notification['kind'], text: string, postId?: string) {
  getDb().notifications.unshift({
    id: randomUUID(),
    memberId,
    kind,
    text,
    postId,
    at: now().toISOString(),
    read: false,
  });
}

function addKarma(memberId: string, reason: KarmaEvent['reason'], postId: string) {
  getDb().karma.push({
    id: randomUUID(),
    memberId,
    reason,
    postId,
    points: reason === 'call_hosted' ? getDb().settings.karmaHost : getDb().settings.karmaCheckin,
    at: now().toISOString(),
  });
}

// --- Rollen & Moderation ---------------------------------------------------

function roleOf(id: string): SocialRole | undefined {
  return getDb().roles[id];
}

function isStaff(id: string): boolean {
  return roleOf(id) !== undefined;
}

function requireStaff(req: Request): string {
  const me = viewer(req);
  if (!isStaff(me)) throw new HttpError(403, 'Nur für YF Social Admins & Moderatoren');
  return me;
}

function requireAdmin(req: Request): string {
  const me = viewer(req);
  if (roleOf(me) !== 'admin') throw new HttpError(403, 'Nur für YF Social Admins');
  return me;
}

function audit(actorId: string, text: string) {
  getDb().audit.unshift({ id: randomUUID(), actorId, text, at: now().toISOString() });
}

function assertCanWrite(me: string) {
  if (getDb().muted.includes(me)) throw new HttpError(403, 'Dein Konto ist in YF Social aktuell stummgeschaltet');
}

/** Wortfilter: Treffer werden nicht blockiert, sondern automatisch gemeldet. */
function autoFlag(text: string, postId: string, commentId?: string) {
  const lower = text.toLowerCase();
  const hit = getDb().settings.wordFilter.find((w) => w && lower.includes(w.toLowerCase()));
  if (!hit) return;
  getDb().reports.unshift({
    id: randomUUID(),
    postId,
    commentId,
    reason: `Automatisch gemeldet: Wortfilter „${hit}“`,
    at: now().toISOString(),
    status: 'open',
  });
}

function karmaTotals(): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const m of getDb().members) totals[m.id] = 0;
  for (const e of getDb().karma) totals[e.memberId] = (totals[e.memberId] ?? 0) + e.points;
  return totals;
}

const VALID_SLOT = new RegExp(`^\\d{4}-\\d{2}-\\d{2}\\|(${BLOCKS.map((b) => b.id).join('|')})$`);

function parseSlots(input: unknown): SlotKey[] {
  if (!Array.isArray(input)) throw new HttpError(400, 'Verfügbarkeit fehlt');
  const slots = [...new Set(input)].filter((s): s is SlotKey => typeof s === 'string' && VALID_SLOT.test(s));
  if (slots.length === 0) throw new HttpError(400, 'Bitte mindestens ein Zeitfenster wählen');
  return slots;
}

function send(res: Response, req: Request) {
  saveDb();
  res.json(bootstrap(viewer(req)));
}

function bootstrap(viewerId: string): Bootstrap {
  const db = getDb();
  const staff = isStaff(viewerId);
  // Ausgeblendete Inhalte sehen nur Admins & Moderatoren (und Autor:innen ihre eigenen).
  const posts = db.posts
    .filter((p) => staff || !p.hidden || p.authorId === viewerId)
    .map((p) => (staff ? p : { ...p, comments: p.comments.filter((c) => !c.hidden) }));
  return {
    serverNow: now().toISOString(),
    clockOffsetMs: db.clockOffsetMs,
    totalMembers: TOTAL_MEMBERS,
    members: db.members,
    posts: posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    karma: karmaTotals(),
    karmaEvents: db.karma,
    notifications: db.notifications.filter((n) => n.memberId === viewerId),
    settings: db.settings,
    roles: db.roles,
    muted: db.muted,
    reports: staff ? db.reports : [],
    audit: staff ? db.audit : [],
  };
}

const route =
  (fn: (req: Request, res: Response) => void) => (req: Request, res: Response, next: NextFunction) => {
    try {
      fn(req, res);
    } catch (err) {
      next(err);
    }
  };

app.get(
  '/api/bootstrap',
  route((req, res) => res.json(bootstrap(viewer(req)))),
);

app.post(
  '/api/posts',
  route((req, res) => {
    const me = viewer(req);
    assertCanWrite(me);
    const input = req.body as NewPostInput;
    const settings = getDb().settings;
    if (!POST_TYPES.some((t) => t.id === input.type)) throw new HttpError(400, 'Ungültige Beitragsart');
    if (!settings.enabledTypes.includes(input.type)) throw new HttpError(403, 'Diese Beitragsart ist aktuell deaktiviert');
    if (input.type === 'CALL') {
      const role = getDb().members.find((m) => m.id === me)?.role;
      if (settings.callCreation === 'staff' && !isStaff(me)) {
        throw new HttpError(403, 'Calls können aktuell nur Admins & Moderatoren erstellen');
      }
      if (settings.callCreation === 'founders' && role !== 'Founder' && !isStaff(me)) {
        throw new HttpError(403, 'Calls können aktuell nur Founder erstellen');
      }
    }
    const title = String(input.title ?? '').trim();
    const body = String(input.body ?? '').trim();
    if (!title) throw new HttpError(400, 'Bitte ein Thema angeben');

    const post: Post = {
      id: randomUUID(),
      type: input.type,
      title,
      body,
      authorId: me,
      createdAt: now().toISOString(),
      upvotes: [],
      comments: [],
    };

    if (input.type === 'CALL') {
      const c = input.call;
      if (!c || !GROUP_SIZES.some((g) => g.id === c.groupSize)) throw new HttpError(400, 'Bitte eine Gruppengröße wählen');
      if (!body) throw new HttpError(400, 'Bitte eine Beschreibung angeben');
      const allowedDays = new Set(matrixDays(now()));
      const slots = parseSlots(c.hostAvailability).filter(
        (s) => allowedDays.has(s.split('|')[0]) && slotStart(s).getTime() > now().getTime(),
      );
      if (slots.length === 0) throw new HttpError(400, 'Bitte Zeitfenster in den kommenden 2 Wochen wählen');
      const link = String(c.meetingLink ?? '').trim();
      if (!/^https?:\/\//.test(link)) throw new HttpError(400, 'Bitte einen gültigen Meeting-Link (https://…) angeben');
      post.call = {
        groupSize: c.groupSize,
        meetingLink: link,
        hostAvailability: slots,
        participants: [],
        capacityExpanded: false,
        checkIns: [],
      };
      addKarma(me, 'call_hosted', post.id);
    }

    getDb().posts.push(post);
    autoFlag(`${title} ${body}`, post.id);
    send(res, req);
  }),
);

app.post(
  '/api/posts/:id/upvote',
  route((req, res) => {
    const me = viewer(req);
    const post = findPost(req.params.id as string);
    post.upvotes = post.upvotes.includes(me) ? post.upvotes.filter((u) => u !== me) : [...post.upvotes, me];
    send(res, req);
  }),
);

app.post(
  '/api/posts/:id/comments',
  route((req, res) => {
    const me = viewer(req);
    assertCanWrite(me);
    const post = findPost(req.params.id as string);
    if (post.commentsLocked) throw new HttpError(403, 'Kommentare zu diesem Beitrag sind gesperrt');
    const body = String(req.body?.body ?? '').trim();
    if (!body) throw new HttpError(400, 'Kommentar ist leer');
    const comment = { id: randomUUID(), authorId: me, body, createdAt: now().toISOString() };
    post.comments.push(comment);
    autoFlag(body, post.id, comment.id);
    send(res, req);
  }),
);

app.post(
  '/api/calls/:id/join',
  route((req, res) => {
    const me = viewer(req);
    const post = findCall(req.params.id as string);
    const phase = callPhase(post, now());
    if (phase === 'past') throw new HttpError(400, 'Dieser Call ist beendet oder geschlossen');
    assertCanWrite(me);
    if (post.authorId === me) throw new HttpError(400, 'Du bist der Host dieses Calls');

    const hostSlots = new Set(post.call.hostAvailability);
    const availability = parseSlots(req.body?.availability).filter((s) => hostSlots.has(s));
    if (availability.length === 0) throw new HttpError(400, 'Kein gemeinsames Zeitfenster mit dem Host gewählt');

    const existing = post.call.participants.find((p) => p.memberId === me);
    if (existing) {
      existing.availability = availability;
    } else {
      const wasOverbooked = isOverbooked(post);
      post.call.participants.push({ memberId: me, availability, joinedAt: now().toISOString() });
      if (isOverbooked(post) && !wasOverbooked) {
        notify(
          post.authorId,
          'overbooked',
          `Dein Call „${post.title}“ ist überbucht (${headcount(post)}/${capacity(post.call)}). Erweitern oder duplizieren?`,
          post.id,
        );
      } else {
        notify(post.authorId, 'joined', `${memberName(me)} nimmt verbindlich an „${post.title}“ teil.`, post.id);
      }
    }
    send(res, req);
  }),
);

app.post(
  '/api/calls/:id/leave',
  route((req, res) => {
    const me = viewer(req);
    const post = findCall(req.params.id as string);
    post.call.participants = post.call.participants.filter((p) => p.memberId !== me);
    send(res, req);
  }),
);

app.post(
  '/api/calls/:id/finalize',
  route((req, res) => {
    const me = viewer(req);
    const post = findCall(req.params.id as string);
    if (post.authorId !== me) throw new HttpError(403, 'Nur der Host kann den Termin fixieren');
    const requested = req.body?.slot as SlotKey | undefined;
    const slot = requested ?? effectiveSlot(post.call, now());
    if (!slot || !post.call.hostAvailability.includes(slot)) throw new HttpError(400, 'Ungültiger Termin');
    post.call.finalSlot = slot;
    for (const p of post.call.participants) {
      notify(p.memberId, 'info', `Termin für „${post.title}“ steht: ${formatSlot(slot)}.`, post.id);
    }
    send(res, req);
  }),
);

app.post(
  '/api/calls/:id/unfinalize',
  route((req, res) => {
    const me = viewer(req);
    const post = findCall(req.params.id as string);
    if (post.authorId !== me) throw new HttpError(403, 'Nur der Host kann die Terminfindung wieder öffnen');
    delete post.call.finalSlot;
    send(res, req);
  }),
);

app.post(
  '/api/calls/:id/resolve-overbooking',
  route((req, res) => {
    const me = viewer(req);
    const post = findCall(req.params.id as string);
    if (post.authorId !== me) throw new HttpError(403, 'Nur der Host kann über die Überbuchung entscheiden');
    if (!isOverbooked(post)) throw new HttpError(400, 'Call ist nicht überbucht');
    const mode = req.body?.mode;

    if (mode === 'expand') {
      post.call.capacityExpanded = true;
    } else if (mode === 'duplicate') {
      // Die zuerst Angemeldeten bleiben, der Überhang zieht in den neuen Call um.
      const keep = capacity(post.call) - 1;
      const sorted = [...post.call.participants].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
      const overflow = sorted.slice(keep);
      post.call.participants = sorted.slice(0, keep);
      const copies = getDb().posts.filter((p) => p.call?.parentCallId === post.id).length;
      const duplicate: Post = {
        id: randomUUID(),
        type: 'CALL',
        title: `${post.title} (Runde ${copies + 2})`,
        body: post.body,
        authorId: post.authorId,
        createdAt: now().toISOString(),
        upvotes: [],
        comments: [],
        call: {
          groupSize: post.call.groupSize,
          meetingLink: post.call.meetingLink,
          hostAvailability: [...post.call.hostAvailability],
          participants: overflow,
          capacityExpanded: false,
          checkIns: [],
          parentCallId: post.id,
        },
      };
      getDb().posts.push(duplicate);
      addKarma(me, 'call_hosted', duplicate.id);
      for (const p of overflow) {
        notify(p.memberId, 'moved', `Du wurdest in die parallele Runde von „${post.title}“ verschoben.`, duplicate.id);
      }
    } else {
      throw new HttpError(400, 'Unbekannte Option');
    }
    getDb()
      .notifications.filter((n) => n.postId === post.id && n.kind === 'overbooked')
      .forEach((n) => (n.read = true));
    send(res, req);
  }),
);

app.post(
  '/api/calls/:id/checkin',
  route((req, res) => {
    const me = viewer(req);
    const post = findCall(req.params.id as string);
    if (!isInCall(post, me)) throw new HttpError(403, 'Du bist für diesen Call nicht angemeldet');
    if (callPhase(post, now()) !== 'checkin') {
      throw new HttpError(400, 'Der Check-in öffnet 15 Minuten vor dem Start');
    }
    if (!post.call.checkIns.includes(me)) {
      post.call.checkIns.push(me);
      addKarma(me, 'call_checkin', post.id);
    }
    saveDb();
    res.json({ meetingLink: post.call.meetingLink, state: bootstrap(me) });
  }),
);

app.post(
  '/api/notifications/read',
  route((req, res) => {
    const me = viewer(req);
    getDb()
      .notifications.filter((n) => n.memberId === me)
      .forEach((n) => (n.read = true));
    send(res, req);
  }),
);

app.post(
  '/api/posts/:id/report',
  route((req, res) => {
    const me = viewer(req);
    const post = findPost(req.params.id as string);
    const reason = String(req.body?.reason ?? '').trim();
    if (!reason) throw new HttpError(400, 'Bitte einen Grund angeben');
    const commentId = req.body?.commentId ? String(req.body.commentId) : undefined;
    const duplicate = getDb().reports.some(
      (r) => r.postId === post.id && r.commentId === commentId && r.reporterId === me && r.status === 'open',
    );
    if (duplicate) throw new HttpError(400, 'Du hast diesen Inhalt bereits gemeldet');
    getDb().reports.unshift({ id: randomUUID(), postId: post.id, commentId, reporterId: me, reason, at: now().toISOString(), status: 'open' });
    send(res, req);
  }),
);

// --- YF Social Admin ---------------------------------------------------------

app.post(
  '/api/admin/posts/:id',
  route((req, res) => {
    const me = requireStaff(req);
    const post = findPost(req.params.id as string);
    const { pinned, hidden, commentsLocked } = req.body ?? {};
    if (typeof pinned === 'boolean') {
      post.pinned = pinned;
      audit(me, `hat „${post.title}“ ${pinned ? 'angepinnt' : 'gelöst'}`);
    }
    if (typeof hidden === 'boolean') {
      post.hidden = hidden;
      audit(me, `hat „${post.title}“ ${hidden ? 'ausgeblendet' : 'wiederhergestellt'}`);
      if (hidden) notify(post.authorId, 'info', `Dein Beitrag „${post.title}“ wurde von der Moderation ausgeblendet.`);
    }
    if (typeof commentsLocked === 'boolean') {
      post.commentsLocked = commentsLocked;
      audit(me, `hat Kommentare zu „${post.title}“ ${commentsLocked ? 'gesperrt' : 'freigegeben'}`);
    }
    send(res, req);
  }),
);

app.post(
  '/api/admin/posts/:id/comments/:commentId',
  route((req, res) => {
    const me = requireStaff(req);
    const post = findPost(req.params.id as string);
    const comment = post.comments.find((c) => c.id === req.params.commentId);
    if (!comment) throw new HttpError(404, 'Kommentar nicht gefunden');
    comment.hidden = Boolean(req.body?.hidden);
    audit(me, `hat einen Kommentar von ${memberName(comment.authorId)} ${comment.hidden ? 'ausgeblendet' : 'wiederhergestellt'}`);
    send(res, req);
  }),
);

app.post(
  '/api/admin/calls/:id/close',
  route((req, res) => {
    const me = requireStaff(req);
    const post = findCall(req.params.id as string);
    post.call.closed = !req.body?.reopen;
    audit(me, `hat den Call „${post.title}“ ${post.call.closed ? 'geschlossen' : 'wieder geöffnet'}`);
    if (post.call.closed) {
      for (const id of [post.authorId, ...post.call.participants.map((p) => p.memberId)]) {
        notify(id, 'info', `Der Call „${post.title}“ wurde von der Moderation geschlossen.`, post.id);
      }
    }
    send(res, req);
  }),
);

app.post(
  '/api/admin/reports/:id',
  route((req, res) => {
    const me = requireStaff(req);
    const report = getDb().reports.find((r) => r.id === req.params.id);
    if (!report) throw new HttpError(404, 'Meldung nicht gefunden');
    const status = req.body?.status as Report['status'];
    if (status !== 'dismissed' && status !== 'actioned') throw new HttpError(400, 'Ungültiger Status');
    report.status = status;
    report.resolvedBy = me;
    report.resolvedAt = now().toISOString();
    const post = findPost(report.postId);
    if (status === 'actioned') {
      if (report.commentId) {
        const c = post.comments.find((x) => x.id === report.commentId);
        if (c) c.hidden = true;
      } else {
        post.hidden = true;
      }
    }
    audit(
      me,
      `hat eine Meldung zu „${post.title}“ ${status === 'actioned' ? 'bestätigt und den Inhalt ausgeblendet' : 'verworfen'}`,
    );
    send(res, req);
  }),
);

app.post(
  '/api/admin/roles',
  route((req, res) => {
    const me = requireAdmin(req);
    const memberId = String(req.body?.memberId ?? '');
    const role = req.body?.role as SocialRole | 'member';
    if (!getDb().members.some((m) => m.id === memberId)) throw new HttpError(404, 'Mitglied nicht gefunden');
    if (!['admin', 'moderator', 'member'].includes(role)) throw new HttpError(400, 'Ungültige Rolle');
    const roles = getDb().roles;
    const admins = Object.values(roles).filter((r) => r === 'admin').length;
    if (roles[memberId] === 'admin' && role !== 'admin' && admins <= 1) {
      throw new HttpError(400, 'Es muss mindestens ein YF Social Admin bleiben');
    }
    if (role === 'member') delete roles[memberId];
    else roles[memberId] = role;
    const label = { admin: 'YF Social Admin', moderator: 'Moderator', member: 'Mitglied ohne Sonderrolle' }[role];
    audit(me, `hat ${memberName(memberId)} zu „${label}“ gemacht`);
    notify(memberId, 'info', `Deine Rolle in YF Social: ${label}.`);
    send(res, req);
  }),
);

app.post(
  '/api/admin/mute',
  route((req, res) => {
    const me = requireStaff(req);
    const memberId = String(req.body?.memberId ?? '');
    if (!getDb().members.some((m) => m.id === memberId)) throw new HttpError(404, 'Mitglied nicht gefunden');
    if (isStaff(memberId)) throw new HttpError(400, 'Admins & Moderatoren können nicht stummgeschaltet werden');
    const muted = Boolean(req.body?.muted);
    const db = getDb();
    db.muted = muted ? [...new Set([...db.muted, memberId])] : db.muted.filter((m) => m !== memberId);
    audit(me, `hat ${memberName(memberId)} ${muted ? 'stummgeschaltet' : 'wieder freigeschaltet'}`);
    send(res, req);
  }),
);

app.post(
  '/api/admin/settings',
  route((req, res) => {
    const me = requireAdmin(req);
    const input = (req.body ?? {}) as Partial<SocialSettings>;
    const s = getDb().settings;
    const int = (v: unknown, min: number, max: number) => {
      const n = Math.round(Number(v));
      if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `Wert muss zwischen ${min} und ${max} liegen`);
      return n;
    };
    if (input.enabledTypes) {
      const types = input.enabledTypes.filter((t) => POST_TYPES.some((p) => p.id === t));
      if (types.length === 0) throw new HttpError(400, 'Mindestens eine Beitragsart muss aktiv bleiben');
      s.enabledTypes = types;
    }
    if (input.callCreation) {
      if (!['all', 'founders', 'staff'].includes(input.callCreation)) throw new HttpError(400, 'Ungültige Option');
      s.callCreation = input.callCreation;
    }
    if (input.karmaHost !== undefined) s.karmaHost = int(input.karmaHost, 0, 100);
    if (input.karmaCheckin !== undefined) s.karmaCheckin = int(input.karmaCheckin, 0, 100);
    if (input.checkinLeadMin !== undefined) {
      s.checkinLeadMin = int(input.checkinLeadMin, 5, 120);
      setCheckinLead(s.checkinLeadMin);
    }
    if (input.wordFilter) {
      s.wordFilter = [...new Set(input.wordFilter.map((w) => String(w).trim().toLowerCase()).filter(Boolean))];
    }
    audit(me, 'hat die YF-Social-Einstellungen geändert');
    send(res, req);
  }),
);

// --- Demo-Werkzeuge (nur Prototyp) ---------------------------------------

app.post(
  '/api/demo/clock',
  route((req, res) => {
    const db = getDb();
    if (req.body?.reset) {
      db.clockOffsetMs = 0;
    } else if (req.body?.jumpToCheckIn) {
      const post = findCall(String(req.body.jumpToCheckIn));
      const slot = effectiveSlot(post.call, now());
      if (!slot) throw new HttpError(400, 'Kein Termin vorhanden');
      const target = slotStart(slot).getTime() - CHECKIN_LEAD_MS + 30 * 1000;
      db.clockOffsetMs = target - Date.now();
    } else {
      db.clockOffsetMs += Number(req.body?.addMs ?? 0);
    }
    send(res, req);
  }),
);

app.post(
  '/api/demo/reset',
  route((req, res) => {
    resetDb();
    send(res, req);
  }),
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Interner Fehler' });
});

app.listen(PORT, () => {
  console.log(`YF Social API läuft auf http://localhost:${PORT}`);
});
