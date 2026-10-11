# YF Social – Prototyp v1

Community Hub & Call-Aggregator für die YFN Member-Plattform, umgesetzt nach [planv1.md](planv1.md).
Komplett in TypeScript: React + Vite (Frontend), Node + Express (API), gemeinsame Logik in `shared/`.

## Starten

```bash
npm install
npm run dev
```

Dann <http://localhost:5173> öffnen. Die API läuft auf Port 3001 (änderbar mit `API_PORT`).

Daten liegen in `data/db.json` und werden beim ersten Start aus `server/seed.ts` erzeugt.
Mit `npm run reset` (oder „Daten zurücksetzen“ in der App) geht es zurück auf den Ausgangszustand.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `shared/types.ts` | Datenmodell (Member-Profil, Beiträge, Calls, Karma) |
| `shared/schedule.ts` | Termin-Matrix, Overlapping-Slot-Matching, Call-Status, Check-in-Fenster |
| `server/members.ts` | Echte Member-Profile aus `member/profile.md` (Bilder: `member/bilder/1–8.png`) |
| `server/seed.ts` | Beispielbeiträge und Calls, Termine relativ zu „heute“ |
| `server/index.ts` | REST-API |
| `src/` | UI im Stil der Plattform, nur der Tab „YF Social“ ist aktiv |

## Meeting-Räume

Beim Erstellen eines Calls ist „Automatisch erstellen“ voreingestellt: Der Server erzeugt einen Jitsi-Meet-Raum
(`server/meetings.ts`) mit lesbarem Namen und zufälligem Suffix, z. B. `https://meet.jit.si/YFN-Fundraising-…-ij0ZToMY`.
Dafür braucht es weder Konto noch API-Schlüssel, und jede Person mit dem Link kann beitreten.
Für einen eigenen Jitsi-Server `JITSI_BASE_URL` setzen. Alternativ kann der Host einen eigenen Link einfügen (Zoom, Teams, Meet, …).

## YF Social Admin

Der Tab „YF Social Admin“ (Sidebar, Bereich „Admin“) ist nur für YF Social Admins und Moderatoren sichtbar.

| | Admin | Moderator |
| --- | :-: | :-: |
| Meldungen bearbeiten (Inhalt ausblenden / verwerfen) | ✓ | ✓ |
| Beiträge anpinnen, ausblenden, Kommentare sperren / ausblenden | ✓ | ✓ |
| Calls schließen / wieder öffnen | ✓ | ✓ |
| Mitglieder stummschalten | ✓ | ✓ |
| Rollen vergeben (Admin, Moderator) | ✓ | |
| Einstellungen: Beitragsarten, wer Calls erstellen darf, Karma-Punkte, Check-in-Vorlauf, Wortfilter | ✓ | |

Alle Aktionen landen im Protokoll. Inhalte werden nur ausgeblendet, nie gelöscht.
Mitglieder können Beiträge über „Melden“ an die Moderation geben. Der Wortfilter erstellt automatische Meldungen.
Im Seed ist Lionel Pillich Admin und Jonas Nolte (Chapter Lead Stuttgart) Moderator.

## Demo-Hilfen (nur Prototyp)

- **Perspektive wechseln:** unten links auf das Profil klicken, z. B. Ben Erler, um als Host den überbuchten Call zu sehen.
- **Zeit vorspulen:** im Call-Detail „Uhr auf 15 Min. vor Start vorspulen“, um den Check-in zu testen.
  In der rechten Spalte gibt es außerdem „+2 Std.“, „+1 Tag“ und „Echtzeit“.

Die Darstellung ist standardmäßig auf 90 % skaliert (`zoom` in `src/styles.css`).

Die Profile sind echt, die Beispielbeiträge sind illustrativ und aus den Profilangaben abgeleitet.
