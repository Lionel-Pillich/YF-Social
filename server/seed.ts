// Seed-Logik für den Prototyp. Inhalte (Mitglieder, Beiträge) kommen aus einem
// austauschbaren Inhaltspaket (server/content). Alle Termine werden relativ zum
// Seed-Zeitpunkt berechnet, damit die Demo an jedem Tag funktioniert.
import { DEFAULT_KARMA } from '../shared/karma';
import { BLOCKS, addDays, slotKey, slotStart, toDateKey } from '../shared/schedule';
import type {
  AuditEntry,
  BlockId,
  CallData,
  CallParticipant,
  Comment,
  Database,
  KarmaEvent,
  Member,
  Notification,
  Post,
  Report,
  SlotKey,
  SocialRole,
  SocialSettings,
} from '../shared/types';

const HOUR = 60 * 60 * 1000;
export const DB_VERSION = 4;

export const DEFAULT_SETTINGS: SocialSettings = {
  enabledTypes: ['CALL', 'DISCUSS', 'LEARNING', 'ASK', 'SHOW'],
  callCreation: 'all',
  karma: { ...DEFAULT_KARMA },
  checkinLeadMin: 15,
  wordFilter: ['casino', 'krypto-gewinn', 'gratis follower'],
};

export const uuid = () => globalThis.crypto.randomUUID();

export interface SeedHelpers {
  /** Slot `offset` Tage ab heute im Zeitfenster `block`. */
  s: (offset: number, block: BlockId) => SlotKey;
  /** ISO-Zeitpunkt vor `hours` Stunden. */
  ago: (hours: number) => string;
  comment: (authorId: string, body: string, hoursAgo: number) => Comment;
  call: (data: Partial<CallData> & Pick<CallData, 'groupSize' | 'hostAvailability'>) => CallData;
  joined: (memberId: string, availability: SlotKey[], hoursAgo: number) => CallParticipant;
  /** Nächster Slot, der mindestens 45 Minuten in der Zukunft startet (Check-in-Demo). */
  nextSlot: SlotKey;
}

export interface SeedPack {
  members: Member[];
  defaultUserId: string;
  totalMembers: number;
  roles: Record<string, SocialRole>;
  build: (h: SeedHelpers) => {
    posts: Post[];
    notifications: Omit<Notification, 'id' | 'read'>[];
    reports: Omit<Report, 'id' | 'status'>[];
    audit: Omit<AuditEntry, 'id'>[];
  };
}

export function createSeed(pack: SeedPack, now = new Date()): Database {
  const today = toDateKey(now);
  const s = (offset: number, block: BlockId): SlotKey => slotKey(addDays(today, offset), block);
  const ago = (hours: number) => new Date(now.getTime() - hours * HOUR).toISOString();

  const nextSlot = (): SlotKey => {
    for (let offset = 0; offset < 3; offset++) {
      for (const b of BLOCKS) {
        const slot = s(offset, b.id);
        if (slotStart(slot).getTime() - now.getTime() > 45 * 60 * 1000) return slot;
      }
    }
    return s(1, 'b18');
  };

  const content = pack.build({
    s,
    ago,
    comment: (authorId, body, hoursAgo) => ({ id: uuid(), authorId, body, createdAt: ago(hoursAgo) }),
    call: (data) => ({
      meetingLink: 'https://meet.jit.si/yfn-social-demo',
      meetingProvider: 'jitsi',
      participants: [],
      capacityExpanded: false,
      checkIns: [],
      ...data,
    }),
    joined: (memberId, availability, hoursAgo) => ({ memberId, availability, joinedAt: ago(hoursAgo) }),
    nextSlot: nextSlot(),
  });

  const karma: KarmaEvent[] = [];
  for (const post of content.posts) {
    if (!post.call) {
      karma.push({
        id: uuid(),
        memberId: post.authorId,
        points: DEFAULT_KARMA[post.type as Exclude<typeof post.type, 'CALL'>],
        reason: 'post_created',
        postId: post.id,
        at: post.createdAt,
      });
      continue;
    }
    karma.push({
      id: uuid(),
      memberId: post.authorId,
      points: DEFAULT_KARMA.callHost,
      reason: 'call_hosted',
      postId: post.id,
      at: post.createdAt,
    });
    for (const memberId of post.call.checkIns) {
      karma.push({
        id: uuid(),
        memberId,
        points: DEFAULT_KARMA.callCheckin,
        reason: 'call_checkin',
        postId: post.id,
        at: slotStart(post.call.finalSlot!).toISOString(),
      });
    }
  }

  return {
    version: DB_VERSION,
    seededAt: now.toISOString(),
    clockOffsetMs: 0,
    defaultUserId: pack.defaultUserId,
    totalMembers: pack.totalMembers,
    members: pack.members,
    posts: content.posts,
    karma,
    notifications: content.notifications.map((n) => ({ ...n, id: uuid(), read: false })),
    settings: { ...DEFAULT_SETTINGS, karma: { ...DEFAULT_KARMA }, enabledTypes: [...DEFAULT_SETTINGS.enabledTypes] },
    roles: { ...pack.roles },
    muted: [],
    reports: content.reports.map((r) => ({ ...r, id: uuid(), status: 'open' as const })),
    audit: content.audit.map((a) => ({ ...a, id: uuid() })),
  };
}
