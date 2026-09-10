# TXTClan Bot — Tickets, Shop, Giveaways & Vouches

TXTClan-Community-Bot: **Ticket-Panels**, **Buy-Panels** mit Gesamtpreis und kopierbarem `/pay`-Befehl, **Giveaways**, **Vouches** und **Nachrichten, die der Bot für dich sendet**. Beliebig viele Panels in verschiedene Kanäle.

Die Web-Vorschau zeigt dasselbe Look & Feel wie in Discord (dunkle Embeds, grüne Kauf-Buttons, Dropdowns). Der eigentliche Bot läuft in deinem Server, sobald ein Token gesetzt ist.

## Was der Bot kann

- **Tickets** — Panel mit Dropdown (Support, Clan-Fight, …). Ein offenes Support-Ticket pro Person. Ist **kein Preis** gesetzt, legt das Team ihn mit **Preis festlegen** oder `/ticket preis` fest — danach erscheint `/pay y3zz <betrag>`.
- **Buy-Panels** — Produkt mit Preis, Verkäufer, Bild und grünem Kauf-Button. Klick öffnet ein privates Ticket, rechnet `Menge × Preis` und postet z. B. `/pay y3zz 18000000`. Nach dem Schließen bekommt der Käufer eine **DM mit Sternen**; die Bewertung wird als Vouch gepostet (Kanal von `/vouch-panel` oder `/setup setzen vouch_kanal`).
- **Mehrere Panels** — `/ticket-panel` und `/buy-panel` so oft senden, wie du willst, in beliebige Kanäle.
- **Texte senden** — `/msg` öffnet ein **Textfenster** (wie eine Bewerbung): Nachricht eintragen, **Senden** postet sie in **diesen Kanal**. Optional `kanal:`, `user:` (DM), Embed mit Titel. `/sagen` und `/embed` nutzen dasselbe Fenster.
- **Giveaways** — Start mit Dauer (`7h`, `30m`, `1d`), Teilnehmen-Button, automatische Auslosung, Reroll.
- **Vouches** — Bewertung mit Sternen, Produkt, Menge, Preis. `/vouch-panel` hängt **ein** Auswertungs-Panel **ans Ende** des Kanals; ein altes Panel wird gelöscht. Neue Vouches (auch per DM) schieben das Panel wieder nach unten.
- **Services** — z. B. Bau-Service mit Limit (`10/10 Tickets – Limit erreicht`).
- **Clan-Bewerbungen** — Panel mit Infos, Preisen und Plätzen (`4/30`). Es zählen nur **angenommene** Mitglieder, und **jede Person nur einmal**. Admins stellen Name, Info, Maximum und Preise per `/clan` ein.

## Bot-Host (Git)

Der Host soll den Code **per Git klonen und bei jedem Start/Update ziehen** — nicht als ZIP hochladen.

1. Das GitHub-Repo ist: https://github.com/KingF3rdi/nexus-discord-bot
2. Im Bot-Host-Panel das Repo eintragen:

| Feld | Wert |
| --- | --- |
| Repository | `https://github.com/KingF3rdi/nexus-discord-bot.git` |
| Branch | `main` |
| Startup-Datei | `index.js` |
| Install | `npm install` |
| Start | `node index.js` |
| Auto-Pull | an |

Der Host muss **Node 22+** (besser 24) nutzen. `DISCORD_TOKEN` als Umgebungsvariable im Panel setzen — nicht in Git.

3. Umgebungsvariable im Host setzen (nicht in Git speichern):

```
DISCORD_TOKEN=dein_bot_token
DATA_DIR=./data
```

Bei einem **privaten** Repo braucht der Host einen GitHub [Personal Access Token](https://github.com/settings/tokens) (Recht `repo`) oder einen Deploy Key. Öffentliche Repos kann der Host ohne Token klonen.

Nach dem ersten Start in Discord `/setup setzen` ausführen.

## Schnellstart (Discord)

1. Anwendung auf [Discord Developer Portal](https://discord.com/developers/applications) anlegen.
2. Unter **Bot** einen Bot erstellen, Token kopieren. **Server Members Intent** einschalten.
3. Unter **OAuth2 → URL Generator**: Scopes `bot` und `applications.commands`. Rechte u. a. Kanäle verwalten, Nachrichten senden, Embeds, Dateien, Nachrichtenverlauf, Rollen verwalten.
4. Bot auf den Server einladen.
5. Im Projektordner:

```bash
cp .env.example .env
# DISCORD_TOKEN=dein_token
npm --prefix bot install
npm run bot
```

6. In Discord: `/setup setzen` (Ticket-Kategorie, Team-Rolle, Standard-Pay-Empfänger), danach Panels posten.

## Wichtige Befehle

| Befehl | Zweck |
| --- | --- |
| `/setup setzen` | Community-Name, Ticket-Kategorie, Team-Rolle, `/pay`-Empfänger |
| `/msg` | Textfenster: Nachricht eintragen und in diesen Kanal senden |
| `/sagen` | Textfenster (optional als Embed) |
| `/embed` | Farbiges Embed — Text im Formatierungsfenster |
| `/ticket-kategorie hinzufuegen` | Anliegen für das Ticket-Dropdown |
| `/ticket-panel` | Ticket-Panel senden (mehrfach möglich) |
| `/ticket preis` | Im Ticket ohne Preis den Betrag setzen → `/pay y3zz` |
| `/produkt erstellen` | Name, Preis, Verkäufer, Minecraft-Empfänger, Bild |
| `/buy-panel` | Kauf-Panel für eine Produkt-ID senden |
| `/spawner hinzufuegen` | Neuen Spawner (Preise + Emoji) |
| `/spawner setzen` | Preise ändern (`13,1M` oder `STOP`), optional Emoji |
| `/spawner emoji` / `entfernen` | Emoji setzen oder Spawner löschen |
| `/spawner rolle` | Eigene Support-Rolle nur für Spawner-Tickets |
| `/spawner-panel` | Spawner-Shop: Preiskacheln, Ankauf/Verkauf, STOP |
| `/clan hinzufuegen` / `/clan entfernen` | Clan aufs Panel / vom Panel nehmen |
| `/clan panel` / `/clan-panel` | Bewerbungspanel: Info, Preise, Plätze (`angenommen/max`) |
| `/clan plaetze` | Maximum setzen (z. B. 30) |
| `/clan info` / `/clan name` / `/clan preis-setzen` | Texte und Preise — Preise selbst festlegen, ändern oder löschen |
| `/clan rolle` | Rolle, die bei Annahme automatisch vergeben wird |
| `/clan annehmen` / `ablehnen` / `kick` | Platz belegen, ablehnen oder wieder freigeben |
| `/pay` | Zahlungsanfrage mit Gesamtbetrag posten |
| `/giveaway starten` | Gewinnspiel mit Button |
| `/vouch erstellen` / `/vouch-panel` | Bewertung posten; ein Panel, immer am Kanalende |
| `/service hinzufuegen` / `/service-panel` | Service-Tickets mit Limit |
| `/help` | Übersicht |

### Beispiel Shop

```
/produkt erstellen name:Thorfinn von Vinland Saga preis:6000000 verkaeufer:@Du empfaenger:y3zz sku:#7 button:Map-Art kaufen
/buy-panel produkt_id:1 listing:True
```

Im geöffneten Ticket steht z. B. bei Menge 3:

- Einzelpreis **$6.000.000**
- Gesamt **$18.000.000**
- Befehl `/pay y3zz 18000000`

### Clan-Bewerbung

```
/clan name text:TXTClan
/clan info text:Aktiver Money-Clan. Fairer Support, klare Preise.
/clan plaetze anzahl:30
/clan preis-setzen bezeichnung:Raid-Kosten betrag:3,0M
/clan preis-setzen bezeichnung:Raid-Kosten betrag:4,5M
/clan preis-entfernen bezeichnung:Raid-Kosten
/clan rolle rolle:@Clan
/clan panel
```

Es gibt **keine** fest eingebauten Preise (kein Eintritt, keine wöchentliche Abgabe). Das Panel bleibt leer, bis das Team Zeilen mit `/clan preis-setzen` anlegt. Dieselbe Bezeichnung erneut setzen ändert den Betrag. `betrag:STOP` oder `/clan preis-entfernen` löscht die Zeile.

Das Panel zeigt z. B. **4/30 Plätze**. Eine Bewerbung ändert die Zahl **nicht**. Erst `/clan annehmen` (oder der Button im Ticket) erhöht auf **5/30** und vergibt die Clan-Rolle. Dieselbe Person ein zweites Mal annehmen ändert nichts. `/clan kick` gibt den Platz frei und nimmt die Rolle wieder.

Nach einem Kauf (Ticket schließen) schickt der Bot dem Käufer eine **DM** mit 1–5 Sternen. Die Bewertung landet im Vouch-Kanal.

Spawner-Team: `/spawner rolle` setzt eine eigene Rolle, die in Spawner-Tickets gepingt wird und Zugriff hat — unabhängig vom normalen Support.

## Web-Vorschau

Ohne Discord-Token:

```bash
npm --prefix dashboard install
npm run dev
```

Öffnet die Discord-ähnliche Oberfläche auf Port **43123**. Dort kannst du Tickets öffnen, Map-Art kaufen (Gesamtpreis + `/pay`), Giveaways, Vouches und Bot-Nachrichten ausprobieren.

## Technik

- **Bot:** Node.js, discord.js 14, SQLite (`bot/data/nexus.db`)
- **Vorschau:** Vite + React + Tailwind
- Daten bleiben lokal. Kein Login, keine Cloud-Datenbank.

## Hinweise

- Slash-Befehle erscheinen nach dem Start (kann auf großen Bots kurz dauern). Bot einmal neu einladen, falls sie fehlen.
- Ticket-Kanäle werden privat in der konfigurierten Kategorie angelegt.
- Der `/pay`-Befehl ist ein **Text zum Kopieren** für euer Ingame-Economy (nicht der Discord-Slash-Command selbst). In Discord existiert zusätzlich `/pay`, um dieselbe Zahlungsanfrage manuell zu posten.
