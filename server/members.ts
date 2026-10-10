// Echte YFN Member-Profile, übernommen aus member/profile.md.
// Die Bilder in member/bilder sind in derselben Reihenfolge nummeriert.
import type { Member } from '../shared/types';

const photo = (n: number) => `/media/members/${n}.png`;

export const CURRENT_USER_ID = 'lionel-pillich';

export const MEMBERS: Member[] = [
  {
    id: 'philipp-schmechel',
    name: 'Philipp Schmechel',
    age: 24,
    location: 'Berlin, DE',
    chapter: 'Berlin',
    role: 'Founder',
    program: 'Startup Teens',
    bio: 'Co-Founder von YFN. CTO @ QiTech. Love to learn but hate to study.',
    areas: ['AI', 'Business', 'Deep Tech', 'Hardware', 'Tech'],
    photo: photo(1),
    companies: [
      {
        name: 'Traumwohnung.ai',
        tagline:
          'Automatisch Wohnungsbewerbungen für Wohnungssuchende verschicken, sobald eine passende Anzeige auf Immoscout24 online geht.',
        stage: 'Skalierung',
        industry: 'PropTech',
        problem: 'Dass die Wohnungssuche so zeitraubend ist',
        solution:
          'Wir verschicken die 1. Bewerbung automatisch. So kommt der Vermieter zum Wohnungssuchenden. Der 1. Schritt der Interaktion ist gelöst.',
        vision:
          'Automatisch Wohnungsbewerbungen für Wohnungssuchende verschicken, sobald eine passende Anzeige auf Immoscout24 online geht.',
      },
    ],
  },
  {
    id: 'milan-von-dem-bussche',
    name: 'Milan von dem Bussche',
    age: 23,
    location: 'Dienheim, DE',
    chapter: 'Online',
    role: 'Founder',
    program: 'YFN Team',
    bio: 'Wir recyceln Plastikmüll zu 3D Druck Filament, produzieren quasi die “Tinte” für 3D Drucker.',
    areas: [],
    photo: photo(2),
    companies: [
      {
        name: 'QiTech',
        tagline: 'Sondermaschinenbau und Software für Sondermaschinenbau',
        stage: 'Etabliert',
        industry: 'Maschinenbau',
        problem: 'schlechte Maschinensoftware',
        solution: 'Bessere Maschinensoftware',
        vision: 'Sondermaschinenbau und Software für Sondermaschinenbau',
      },
    ],
  },
  {
    id: 'ben-erler',
    name: 'Ben Erler',
    age: 22,
    location: 'München, DE',
    chapter: 'Berlin',
    role: 'Founder',
    bio: 'Über meine Gründung mit 16 bin ich zum YFN gekommen und habe einige Projekte initiiert und mit begleitet.',
    areas: [],
    photo: photo(3),
    companies: [
      {
        name: 'Werkera',
        tagline:
          'Deutsche Unternehmen halten das Land am Laufen, Bürokratie ist ihr Endgegner. Werkera nimmt den Betrieben die Bürokratie ab, die ihre eigentliche Arbeit ausbremst.',
        stage: 'Validierung',
        industry: 'Handwerk',
        problem: 'Bürokratie bremst die eigentliche Arbeit von Unternehmen',
        solution: 'Wir beschleunigen bürokratische Prozesse im gewohnten Workflow',
        vision:
          'Bürokratie sollte nicht mehr der Endgegner der Unternehmen sein, die das Land am Laufen halten',
      },
    ],
  },
  {
    id: 'paul-nehme',
    name: 'Paul Nehme',
    age: 23,
    location: 'Dienheim, DE',
    chapter: 'Online',
    role: 'Founder',
    bio: 'Co-Founder von QiTech UG, jetzt als Hardware Engineer bei QiTech und QiTech Industries tätig - Founder von Netucation und CTO - sonst noch Maschinenbau Student an der TU Darmstadt',
    areas: ['Education', 'Hardware', 'Tech'],
    photo: photo(4),
    companies: [],
  },
  {
    id: 'leo-duck',
    name: 'Leo Duck',
    age: 22,
    location: 'München, DE',
    chapter: 'München',
    role: 'Explorer',
    bio: 'Wir entwickeln mit Amezit eine App, die Mithilfe von LLMs Production-ready Applikationen erstellen kann. Ich studiere Ingenieurwissenschaften an der TUM mit Fokus auf ML.',
    areas: ['AI', 'Deep Tech', 'Hardware', 'Tech'],
    photo: photo(5),
    companies: [],
  },
  {
    id: 'jan-heinemann',
    name: 'Jan Heinemann',
    age: 23,
    location: 'Andernach, DE',
    chapter: 'Online',
    role: 'Founder',
    bio: 'Wir erhöhen die Sicherheit von Einsatzkräften!',
    areas: ['AI', 'Deep Tech', 'FinTech', 'Hardware', 'HealthTech'],
    photo: photo(6),
    companies: [
      {
        name: 'Rescuevation',
        tagline:
          'Wir produzieren Ausrüstung für Feuerwehr und öffentliche Gefahrenabwehr, um Einsatzkräften das Leben zu erleichtern. Unser Motto: Safety Made Simple.',
        stage: 'Skalierung',
        industry: 'Öffentliche Sicherheit und Gefahrenabwehr',
        problem: 'safety made simple',
        solution:
          'Modulare und flexible Lösungen für mehr als ein Anwendungsgebiet, welche existierendes Material weiternutzen',
        vision:
          'Wir produzieren Ausrüstung für Feuerwehr und öffentliche Gefahrenabwehr, um Einsatzkräften das Leben zu erleichtern. Unser Motto: Safety Made Simple.',
      },
    ],
  },
  {
    id: 'philipp-hirte',
    name: 'Philipp Hirte',
    age: 21,
    location: 'München, DE',
    chapter: 'München',
    role: 'Founder',
    bio: 'Ich bin Philipp und ermögliche es mit floxform Menschen relevante Informationen 10x schneller zu finden und zu verarbeiten. Dies erreichen wir durch dynamische real-time hyper-personalization von Websiten, um die Bandbreite zwischen dem menschlichen Gehirn und IT-Technologie zu maximieren. Außerdem bin ich aktiv in der Startup Community weltweit, besonders in München mit START Munich und YFN. Ich studiere auch "nebenbei" (offiziell Vollzeit) an der TUM Management and Technology mit Informatik.',
    areas: ['AI', 'Business', 'Deep Tech', 'Tech'],
    photo: photo(7),
    companies: [
      {
        name: 'OXYGEN',
        tagline:
          'GTM und Sales Operating system für early stage companies, welches Sales teams ermöglicht 10 x schneller neue GTM Ideen zu validieren und ermöglicht ihre Kunden auf dem Channel so anzusprechen wo sie zu finden sind. Oxygen hat 90% von dem gesamten GTM Stack, welches vorher 10 verschiedene tools waren built-in und ist durch flexible primitives auf jede sales Strategie anpassbar. Oxygen hat tables vergleichbar zu Clay, Workflows wie N8N, über 50 managed enrichment provider und über 100 sales tool Integrationen, alles steuerbar von Claude Code',
      },
    ],
  },
  {
    id: 'jonas-nolte',
    name: 'Jonas Nolte',
    age: 21,
    location: 'Unterensingen, DE',
    chapter: 'Stuttgart',
    role: 'Founder',
    bio: 'Co-Founder Bauerlieferant || Dualer Student IBM || Chapter Stuttgart Lead',
    areas: ['AI'],
    photo: photo(8),
    companies: [
      {
        name: 'Bauer-Lieferant',
        tagline: 'Eier verkaufen und Bauern Software verkaufen',
        stage: 'Skalierung',
        industry: 'Agriculture, Handel',
        problem:
          'Gute Software, die den Bauernhof digitalisiert und ein breites Sortiment an regionalen Produkten bequem an die Haustür geliefert bekommen',
        solution: 'Mit Apes',
        vision: 'Eier verkaufen und Bauern Software verkaufen',
      },
    ],
  },
  {
    // Eingeloggter Nutzer laut Screenshot der Plattform (Admin-Bereich sichtbar).
    id: CURRENT_USER_ID,
    name: 'Lionel Pillich',
    photo: '/media/members/9.jpg',
    areas: [],
    companies: [],
    isAdmin: true,
  },
];
