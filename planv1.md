# Produktspezifikation: YF Social (Community Hub & Call-Aggregator)

Dieses Dokument dient als Implementierungsgrundlage für das neue interaktive Social-Network-Feature innerhalb der YFN Member-Plattform (`apps/member`).

## 1. Integration in die Navigation (Sidebar)
Das Feature wird als eigenständiger Navigationspunkt in der linken Sidebar von `apps/member` platziert.
* **Anzeigename:** `YF Social`
* **Positionierung:** Einordnung im Bereich „Allgemein“, idealerweise zwischen „Jobs“ und „Mentoring“.

---

## 2. Beitragsarten & Präfixe (Feed)
YF Social verfügt über einen zentralen Feed, in dem Beiträge chronologisch dargestellt und über ein Upvote-System (Likes) gewichtet werden. Jeder Beitrag muss zwingend einem der folgenden fünf Typen zugeordnet sein:

* **`CALL: [Thema]`**: Aufruf zu einem interaktiven Live-Austausch (löst den unten definierten Terminfindungs-Workflow aus).
* **`DISCUSS: [Thema]`**: Textbasierte Diskussionen, Meinungen, Debatten und Fragen, die primär im Feed diskutiert werden.
* **`LEARNING: [Thema]`**: Teilen von Fallstudien, Sales-Playbooks, Post-Mortems, erarbeiteten Leitfäden oder offiziellen Netzwerk-Erkenntnissen.
* **`ASK YFN: [Frage]`**: Konkrete Fragestellungen und Hilfegesuche an die Community.
* **`SHOW YFN: [Projekt]`**: Vorstellung von eigenen MVPs, Prototypen, Code-Repositories oder erreichten Meilensteinen.

---

## 3. Live-Call-Workflow (`CALL`)

### 3.1 Erstellung & Parameter durch den Host
Beim Erstellen eines `CALL`-Beitrags macht der Ersteller (Host) folgende Pflichtangaben:
1. **Thema & Beschreibung**: Worüber soll gesprochen werden?
2. **Ziel-Gruppengröße**: Auswahl via Dropdown aus folgenden Clustern:
   * 2 Personen
   * 5 Personen
   * 5–10 Personen
   * 10–15 Personen
   * 15–20 Personen
3. **Termin-Matrix (Verfügbarkeit des Hosts)**:
   * **Tage**: Freie Auswahl beliebig vieler Tage innerhalb der kommenden 2 Wochen.
   * **Zeitfenster**: Mehrfachauswahl aus vordefinierten Blöcken:
     * 10:00 – 12:00 Uhr
     * 14:00 – 16:00 Uhr
     * 16:00 – 18:00 Uhr
     * 18:00 – 20:00 Uhr
     * 20:00 – 22:00 Uhr

### 3.2 Beitritts- und Matching-Logik
* Nutzer klicken im Feed oder in der Navbar auf den Button **„An diesem Call verbindlich teilnehmen“**.
* Direkt nach dem Klick öffnet sich für den Beitretenden ein Modal mit derselben Termin-Matrix (Tage & Zeitfenster der nächsten 2 Wochen) zur Angabe der eigenen Verfügbarkeit.
* Das System berechnet im Hintergrund kontinuierlich den **Schnittpunkt (Overlapping Slot)** mit den meisten Übereinstimmungen zwischen dem Host und den Teilnehmern.

### 3.3 Überbuchung & Host-Optionen (Admin-Kontrolle)
Sobald die gewählte Gruppengröße überschritten wird und sich weitere Personen anmelden, wird der Call nicht automatisch gesperrt. Der Host erhält eine Benachrichtigung und kann im Dashboard zwischen zwei Optionen wählen:
* **Erweitern**: Das Teilnehmerschnitt-Limit aufheben und alle angemeldeten Personen in diesen einen Call zulassen.
* **Duplizieren**: Einen zweiten, parallelen Call mit identischen Inhalten und identischer Terminmatrix für die überschüssigen Teilnehmer eröffnen.

---

## 4. UI/UX: Horizontale Story-Navbar
`CALL`-Beiträge werden zusätzlich zur normalen Timeline prominent ganz oben in einer horizontalen Leiste der Navbar (vergleichbar mit einer Instagram-Story-Leiste) angezeigt.

* **Farbig (Aktiv):** Der Call sucht aktuell noch Teilnehmer oder befindet sich in der aktiven Terminfindungsphase.
* **Ausgegraut (Inaktiv):** Der Call ist vollzählig/finalisiert, die Umfrage geschlossen oder das Event liegt bereits in der Vergangenheit.

---

## 5. Pragmatisches Karma- & Tracking-System
Um Verbindlichkeit ohne hohe technische Hürden (wie fehleranfällige Drittanbieter-Webhooks zu WhatsApp oder Zoom) zu fördern, wird ein rein belohnungsbasiertes System implementiert:

* **Der Check-in-Button:** Genau 15 Minuten vor dem ermittelten Starttermin ändert sich der Status des Beitrags für alle angemeldeten Teilnehmer zu einem Button: *„Jetzt dem Call beitreten & einchecken“*.
* **Tracking:** Klickt ein Nutzer auf diesen Button, wird er zum vom Host hinterlegten Meeting-Link (z. B. Zoom, Teams, WhatsApp-Call-Link) weitergeleitet und in der internen Datenbank als „anwesend“ registriert.
* **Soft Karma:** Erfolgreiche Check-ins sowie das Hosten von Calls bringen dem Nutzerprofil positive Karma-Punkte. Es gibt vorerst *keine* Punktabzüge bei Nichterscheinen, um den informellen Austausch über Drittkanäle nicht fälschlicherweise zu bestrafen.
