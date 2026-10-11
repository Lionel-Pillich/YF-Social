// Inhaltspaket mit den echten YFN Member-Profilen (nur für den lokalen Server).
import type { Post } from '../../shared/types';
import type { SeedPack } from '../seed';
import { CURRENT_USER_ID, MEMBERS } from '../members';

export const yfnPack: SeedPack = {
  members: MEMBERS,
  defaultUserId: CURRENT_USER_ID,
  totalMembers: 1677,
  roles: { [CURRENT_USER_ID]: 'admin', 'jonas-nolte': 'moderator' },
  build: ({ s, ago, comment, call, joined, nextSlot }) => {
    const stammtischSlot = nextSlot;
  const posts: Post[] = [
      {
        id: 'call-proptech',
        type: 'CALL',
        title: 'Scraping, Automatisierung & Skalierung im PropTech',
        body: 'Bei Traumwohnung.ai verschicken wir Bewerbungen automatisch, sobald ein passendes Inserat online geht. Ich würde gern mit euch über Automatisierung gegen große Plattformen, Zuverlässigkeit und Skalierung sprechen. Kleine Runde, offener Austausch.',
        authorId: 'philipp-schmechel',
        createdAt: ago(20),
        upvotes: ['leo-duck', 'philipp-hirte', 'paul-nehme', 'jonas-nolte'],
        comments: [comment('philipp-hirte', 'Bin dabei – spannend auch aus GTM-Sicht.', 18)],
        call: call({
          groupSize: '5',
          hostAvailability: [s(1, 'b18'), s(2, 'b18'), s(2, 'b20'), s(4, 'b16'), s(5, 'b18')],
          participants: [
            joined('leo-duck', [s(2, 'b18'), s(2, 'b20')], 17),
            joined('philipp-hirte', [s(2, 'b18'), s(4, 'b16')], 15),
            joined('paul-nehme', [s(1, 'b18'), s(2, 'b18')], 9),
          ],
        }),
      },
      {
        id: 'show-oxygen',
        type: 'SHOW',
        title: 'OXYGEN – GTM & Sales Operating System für Early-Stage-Teams',
        body: 'Mit OXYGEN validieren Sales-Teams neue GTM-Ideen 10x schneller. Tables wie in Clay, Workflows wie in N8N, über 50 managed Enrichment-Provider und über 100 Sales-Tool-Integrationen – alles steuerbar über Claude Code. Wer will es für sein Startup testen?',
        authorId: 'philipp-hirte',
        createdAt: ago(26),
        upvotes: ['philipp-schmechel', 'ben-erler', 'leo-duck', 'jonas-nolte', 'jan-heinemann', 'milan-von-dem-bussche'],
        comments: [
          comment('ben-erler', 'Klingt genau nach dem, was wir für Werkera gerade bauen müssten. Schreib mir!', 24),
          comment('jonas-nolte', 'Funktioniert das auch für B2B-Vertrieb an Höfe?', 22),
        ],
      },
      {
        id: 'call-behoerden',
        type: 'CALL',
        title: 'Hardware-Startups & öffentliche Auftraggeber',
        body: 'Mit Rescuevation verkaufen wir Ausrüstung an Feuerwehren und die öffentliche Gefahrenabwehr. Lasst uns Erfahrungen zu Ausschreibungen, Zertifizierungen und langen Sales-Cycles mit Kommunen teilen.',
        authorId: 'jan-heinemann',
        createdAt: ago(30),
        upvotes: ['paul-nehme', 'milan-von-dem-bussche'],
        comments: [],
        call: call({
          groupSize: '5-10',
          hostAvailability: [s(3, 'b14'), s(3, 'b16'), s(6, 'b18'), s(8, 'b18')],
          participants: [
            joined('paul-nehme', [s(3, 'b16'), s(6, 'b18')], 28),
            joined('milan-von-dem-bussche', [s(3, 'b16')], 25),
            joined('philipp-schmechel', [s(6, 'b18'), s(8, 'b18')], 12),
          ],
        }),
      },
      {
        id: 'discuss-llm-apps',
        type: 'DISCUSS',
        title: 'Können LLMs heute schon wirklich production-ready Apps bauen?',
        body: 'Mit Amezit arbeiten wir genau daran. Mich interessiert eure ehrliche Meinung: Wo seht ihr aktuell die größten Lücken – Architektur, Tests, Security oder Wartbarkeit?',
        authorId: 'leo-duck',
        createdAt: ago(34),
        upvotes: ['philipp-hirte', 'philipp-schmechel', 'paul-nehme'],
        comments: [
          comment('paul-nehme', 'Bei Maschinensoftware ganz klar: Tests gegen echte Hardware.', 32),
          comment('philipp-schmechel', 'Wartbarkeit. Der erste Wurf ist schnell, die zehnte Änderung ist das Problem.', 31),
        ],
      },
      {
        id: 'call-overbooked',
        type: 'CALL',
        title: 'Bürokratie-Automatisierung im Handwerk – 1:1 Sparring',
        body: 'Ich suche eine Person für ein ehrliches 1:1 zu Werkera: Welche bürokratischen Prozesse fressen in euren Betrieben (oder denen eurer Eltern) am meisten Zeit?',
        authorId: 'ben-erler',
        createdAt: ago(40),
        upvotes: ['jonas-nolte'],
        comments: [],
        call: call({
          groupSize: '2',
          hostAvailability: [s(2, 'b10'), s(3, 'b18'), s(4, 'b18')],
          participants: [
            joined('jonas-nolte', [s(3, 'b18'), s(4, 'b18')], 38),
            joined('milan-von-dem-bussche', [s(2, 'b10'), s(3, 'b18')], 6),
          ],
        }),
      },
      {
        id: 'ask-ausschreibungen',
        type: 'ASK',
        title: 'Wer hat Erfahrung mit Vergabeplattformen für Kommunen?',
        body: 'Wir wollen bei Rescuevation an öffentlichen Ausschreibungen teilnehmen. Welche Plattformen und Portale nutzt ihr, und worauf sollte man bei den Unterlagen achten?',
        authorId: 'jan-heinemann',
        createdAt: ago(46),
        upvotes: ['ben-erler', 'milan-von-dem-bussche'],
        comments: [comment('ben-erler', 'Mit dem Thema schlagen wir uns bei Werkera ständig rum – lass uns mal sprechen.', 44)],
      },
      {
        id: 'call-stammtisch',
        type: 'CALL',
        title: 'Chapter Stuttgart – Online-Stammtisch',
        body: 'Offene Runde für alle aus dem Chapter Stuttgart und alle, die neu dabei sind: Was baut ihr gerade, wo hängt ihr fest, wer kann wem helfen?',
        authorId: 'jonas-nolte',
        createdAt: ago(60),
        upvotes: ['ben-erler', CURRENT_USER_ID],
        comments: [],
        call: call({
          groupSize: '10-15',
          meetingLink: 'https://meet.jit.si/yfn-chapter-stuttgart',
          hostAvailability: [stammtischSlot],
          finalSlot: stammtischSlot,
          participants: [
            joined(CURRENT_USER_ID, [stammtischSlot], 50),
            joined('ben-erler', [stammtischSlot], 48),
            joined('leo-duck', [stammtischSlot], 30),
          ],
        }),
      },
      {
        id: 'show-traumwohnung',
        type: 'SHOW',
        title: 'Traumwohnung.ai – die erste Bewerbung geht automatisch raus',
        body: 'Sobald auf Immoscout24 eine passende Anzeige online geht, verschicken wir die erste Bewerbung automatisch. So kommt der Vermieter zum Wohnungssuchenden. Ihr sucht gerade eine Wohnung? Testet es und gebt mir Feedback.',
        authorId: 'philipp-schmechel',
        createdAt: ago(70),
        upvotes: ['milan-von-dem-bussche', 'leo-duck', 'paul-nehme', 'jan-heinemann', 'ben-erler'],
        comments: [],
      },
      {
        id: 'learning-qitech',
        type: 'LEARNING',
        title: 'Warum wir bei QiTech unsere Maschinensoftware selbst bauen',
        body: 'Problem: schlechte Maschinensoftware. Lösung: bessere Maschinensoftware. Klingt banal, war aber der Grund, warum wir neben dem Sondermaschinenbau eine eigene Software-Schiene aufgebaut haben. Im letzten Open-Lab-Call haben wir die wichtigsten Punkte gesammelt – Fragen gern in die Kommentare.',
        authorId: 'milan-von-dem-bussche',
        createdAt: ago(80),
        upvotes: ['paul-nehme', 'philipp-schmechel', 'jan-heinemann', 'leo-duck'],
        comments: [comment('jan-heinemann', 'Sehr relevant für Hardware-Startups. Danke fürs Teilen!', 76)],
      },
      {
        id: 'call-openlab',
        type: 'CALL',
        title: 'QiTech Open Lab – bessere Maschinensoftware',
        body: 'Offener Call rund um Sondermaschinenbau, Recycling zu 3D-Druck-Filament und Software für Maschinen.',
        authorId: 'milan-von-dem-bussche',
        createdAt: ago(240),
        upvotes: ['paul-nehme', 'ben-erler', 'jonas-nolte'],
        comments: [],
        call: call({
          groupSize: '5',
          meetingLink: 'https://meet.jit.si/yfn-qitech-open-lab',
          hostAvailability: [s(-3, 'b16'), s(-2, 'b18')],
          finalSlot: s(-3, 'b16'),
          participants: [
            joined('paul-nehme', [s(-3, 'b16')], 230),
            joined('ben-erler', [s(-3, 'b16'), s(-2, 'b18')], 200),
            joined('jonas-nolte', [s(-3, 'b16')], 150),
          ],
          checkIns: ['milan-von-dem-bussche', 'paul-nehme', 'ben-erler'],
        }),
      },
      {
        id: 'ask-hofladen',
        type: 'ASK',
        title: 'Kennt ihr Höfe, die neue Software testen würden?',
        body: 'Für Bauer-Lieferant suchen wir landwirtschaftliche Betriebe, die mit uns die Digitalisierung ihres Hofs testen. Auch einzelne Intros helfen enorm!',
        authorId: 'jonas-nolte',
        createdAt: ago(96),
        upvotes: ['leo-duck', 'ben-erler'],
        comments: [],
      },
      {
        id: 'discuss-studium',
        type: 'DISCUSS',
        title: 'Studium und Gründung parallel – wie bekommt ihr das hin?',
        body: 'Maschinenbau an der TU Darmstadt, Hardware bei QiTech und Netucation als CTO: Ich jongliere gerade ziemlich viel. Wie priorisiert ihr, wenn Klausurphase und Kundentermine kollidieren?',
        authorId: 'paul-nehme',
        createdAt: ago(110),
        upvotes: ['jonas-nolte', 'philipp-hirte', 'leo-duck'],
        comments: [
          comment('philipp-hirte', 'Offiziell Vollzeit an der TUM, inoffiziell nebenbei – du bist nicht allein 😄', 100),
          comment('jonas-nolte', 'Dual studieren hilft: Feste Blöcke für Uni, feste Blöcke fürs Startup.', 98),
        ],
      },
    ];

    return {
      posts,
      notifications: [
        {
          memberId: 'ben-erler',
          kind: 'overbooked',
          text: 'Dein Call „Bürokratie-Automatisierung im Handwerk – 1:1 Sparring“ ist überbucht (3/2). Erweitern oder duplizieren?',
          postId: 'call-overbooked',
          at: ago(6),
        },
        {
          memberId: CURRENT_USER_ID,
          kind: 'info',
          text: 'Der Termin für „Chapter Stuttgart – Online-Stammtisch“ steht fest. Der Check-in öffnet 15 Minuten vor Start.',
          postId: 'call-stammtisch',
          at: ago(2),
        },
      ],
      reports: [
        {
          postId: 'learning-qitech',
          reporterId: 'leo-duck',
          reason: 'Falsche Beitragsart – passt eher zu SHOW YFN',
          at: ago(5),
        },
      ],
      audit: [{ actorId: CURRENT_USER_ID, text: 'hat Jonas Nolte zum Moderator ernannt', at: ago(72) }],
    };
  },
};
