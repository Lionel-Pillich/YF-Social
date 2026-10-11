// Gemeinsame Typen für Server und Client.

/** Rolle eines Mitglieds, wie im Member-Verzeichnis als Badge angezeigt. */
export type MemberRole = 'Founder' | 'Explorer';

export type CompanyStage = 'Idee' | 'Validierung' | 'Skalierung' | 'Etabliert';

/** Unternehmen aus dem Reiter „Unternehmen“ eines Member-Profils. */
export interface Company {
  name: string;
  tagline: string;
  stage?: CompanyStage;
  industry?: string;
  problem?: string;
  solution?: string;
  vision?: string;
}

/** Struktur eines YFN Member-Profils (siehe member/profile.md). */
export interface Member {
  id: string;
  name: string;
  age?: number;
  location?: string;
  /** Chapter-Zugehörigkeit („groups“), z. B. „Berlin“ oder „Online“. */
  chapter?: string;
  role?: MemberRole;
  /** Zusätzliche Programm-/Team-Zugehörigkeit, z. B. „YFN Team“. */
  program?: string;
  bio?: string;
  areas: string[];
  /** Pfad zum Profilbild; fehlt es, werden Initialen angezeigt. */
  photo?: string;
  companies: Company[];
  isAdmin?: boolean;
}

export type PostType = 'CALL' | 'DISCUSS' | 'LEARNING' | 'ASK' | 'SHOW';

export type GroupSize = '2' | '5' | '5-10' | '10-15' | '15-20';

export type BlockId = 'b10' | 'b14' | 'b16' | 'b18' | 'b20';

/** Ein Slot ist ein Tag + Zeitfenster, serialisiert als `YYYY-MM-DD|bXX`. */
export type SlotKey = `${string}|${BlockId}`;

export type MeetingProvider = 'jitsi' | 'custom';

export interface CallParticipant {
  memberId: string;
  availability: SlotKey[];
  joinedAt: string;
}

export interface CallData {
  groupSize: GroupSize;
  meetingLink: string;
  /** „jitsi“ = automatisch erzeugter Raum, „custom“ = vom Host eingefügter Link. */
  meetingProvider?: MeetingProvider;
  hostAvailability: SlotKey[];
  participants: CallParticipant[];
  /** Vom Host fixierter Termin. Ohne Fixierung gilt der beste Overlapping Slot. */
  finalSlot?: SlotKey;
  /** Host hat bei Überbuchung „Erweitern“ gewählt – kein Limit mehr. */
  capacityExpanded: boolean;
  /** Bei „Duplizieren“: Verweis auf den ursprünglichen Call. */
  parentCallId?: string;
  /** Member-IDs, die eingecheckt haben („anwesend“). */
  checkIns: string[];
  /** Von der Moderation geschlossen – keine Anmeldung, kein Check-in mehr. */
  closed?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  hidden?: boolean;
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  body: string;
  authorId: string;
  createdAt: string;
  upvotes: string[];
  comments: Comment[];
  call?: CallData;
  /** Moderation: oben im Feed angepinnt. */
  pinned?: boolean;
  /** Moderation: für Mitglieder ausgeblendet (nicht gelöscht). */
  hidden?: boolean;
  commentsLocked?: boolean;
}

/** Rolle innerhalb von YF Social (unabhängig von Founder/Explorer). */
export type SocialRole = 'admin' | 'moderator';

export type CallCreationPolicy = 'all' | 'founders' | 'staff';

export interface SocialSettings {
  enabledTypes: PostType[];
  callCreation: CallCreationPolicy;
  karmaHost: number;
  karmaCheckin: number;
  checkinLeadMin: number;
  /** Beiträge/Kommentare mit diesen Begriffen werden automatisch gemeldet. */
  wordFilter: string[];
}

export interface Report {
  id: string;
  postId: string;
  commentId?: string;
  /** Leer bei automatischen Meldungen durch den Wortfilter. */
  reporterId?: string;
  reason: string;
  at: string;
  status: 'open' | 'dismissed' | 'actioned';
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  text: string;
  at: string;
}

export interface KarmaEvent {
  id: string;
  memberId: string;
  points: number;
  reason: 'call_hosted' | 'call_checkin';
  postId: string;
  at: string;
}

export interface Notification {
  id: string;
  memberId: string;
  text: string;
  postId?: string;
  at: string;
  read: boolean;
  kind: 'overbooked' | 'joined' | 'moved' | 'info';
}

export interface Database {
  version: number;
  seededAt: string;
  /** Demo-Zeitverschiebung in ms (zum Testen des Check-in-Fensters). */
  clockOffsetMs: number;
  members: Member[];
  posts: Post[];
  karma: KarmaEvent[];
  notifications: Notification[];
  settings: SocialSettings;
  roles: Record<string, SocialRole>;
  muted: string[];
  reports: Report[];
  audit: AuditEntry[];
}

export interface Bootstrap {
  serverNow: string;
  clockOffsetMs: number;
  totalMembers: number;
  members: Member[];
  posts: Post[];
  karma: Record<string, number>;
  karmaEvents: KarmaEvent[];
  notifications: Notification[];
  settings: SocialSettings;
  roles: Record<string, SocialRole>;
  muted: string[];
  /** Nur für Admins & Moderatoren befüllt. */
  reports: Report[];
  audit: AuditEntry[];
}

export interface NewPostInput {
  type: PostType;
  title: string;
  body: string;
  call?: {
    groupSize: GroupSize;
    /** „auto“ erzeugt einen offenen Jitsi-Raum; sonst wird meetingLink verwendet. */
    linkMode: 'auto' | 'custom';
    meetingLink?: string;
    hostAvailability: SlotKey[];
  };
}
