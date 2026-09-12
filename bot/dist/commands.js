import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, } from "discord.js";
export const commands = [
    new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Server für Tickets, Shop und Giveaways einrichten")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((s) => s.setName("anzeigen").setDescription("Aktuelle Einstellungen anzeigen"))
        .addSubcommand((s) => s
        .setName("setzen")
        .setDescription("Einstellungen speichern")
        .addStringOption((o) => o.setName("name").setDescription("Community-Name (Footer & Begrüßung)"))
        .addChannelOption((o) => o.setName("ticket_kategorie").setDescription("Kategorie für Ticket-Kanäle").addChannelTypes(ChannelType.GuildCategory))
        .addRoleOption((o) => o.setName("team_rolle").setDescription("Team-/Support-Rolle"))
        .addRoleOption((o) => o.setName("spawner_rolle").setDescription("Eigene Support-Rolle nur für Spawner-Tickets"))
        .addChannelOption((o) => o.setName("log_kanal").setDescription("Log-Kanal").addChannelTypes(ChannelType.GuildText))
        .addChannelOption((o) => o.setName("vouch_kanal").setDescription("Kanal für Bewertungen nach dem Kauf (DM)").addChannelTypes(ChannelType.GuildText))
        .addStringOption((o) => o.setName("pay_empfaenger").setDescription("Standard-Minecraft-Name für /pay (Standard: y3zz)"))
        .addStringOption((o) => o.setName("footer").setDescription("Footer-Text der Embeds"))),
    new SlashCommandBuilder()
        .setName("sagen")
        .setDescription("Textfenster: Markdown, Zeilenumbrüche, optional Embed")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
        .addBooleanOption((o) => o.setName("embed").setDescription("Als Embed senden"))
        .addStringOption((o) => o.setName("farbe").setDescription("Embed-Farbe (gruen, gelb, rot, gold oder #hex)"))
        .addStringOption((o) => o.setName("titel").setDescription("Embed-Titel")),
    new SlashCommandBuilder()
        .setName("msg")
        .setDescription("Öffnet ein Textfenster: Nachricht eintragen und in den Kanal senden")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal (Standard: dieser Kanal)").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
        .addUserOption((o) => o.setName("user").setDescription("Stattdessen per DM an diese Person"))
        .addBooleanOption((o) => o.setName("embed").setDescription("Als farbiges Embed senden"))
        .addStringOption((o) => o.setName("farbe").setDescription("Embed-Farbe: gruen, gelb, rot, gold oder #hex")),
    new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Embed senden — Textfenster mit Markdown und Zeilenumbrüchen")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption((o) => o.setName("titel").setDescription("Titel"))
        .addStringOption((o) => o.setName("farbe").setDescription("gruen, gelb, rot, gold oder #hex"))
        .addStringOption((o) => o.setName("bild").setDescription("Bild-URL"))
        .addStringOption((o) => o.setName("footer").setDescription("Footer"))
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    new SlashCommandBuilder()
        .setName("ticket-kategorie")
        .setDescription("Kategorien für Ticket-Panels verwalten")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((s) => s
        .setName("hinzufuegen")
        .setDescription("Neue Kategorie anlegen")
        .addStringOption((o) => o.setName("name").setDescription("z. B. Website-Support").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(true))
        .addStringOption((o) => o.setName("beschreibung").setDescription("Kurztext").setRequired(true)))
        .addSubcommand((s) => s.setName("liste").setDescription("Alle Kategorien anzeigen"))
        .addSubcommand((s) => s
        .setName("entfernen")
        .setDescription("Kategorie löschen")
        .addIntegerOption((o) => o.setName("id").setDescription("Kategorie-ID").setRequired(true))),
    new SlashCommandBuilder()
        .setName("ticket-panel")
        .setDescription("Ticket-Panel mit Dropdown in diesen Kanal senden")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    new SlashCommandBuilder()
        .setName("produkt")
        .setDescription("Shop-Produkte anlegen")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((s) => s
        .setName("erstellen")
        .setDescription("Neues Produkt für Buy-Panels")
        .addStringOption((o) => o.setName("name").setDescription("Produktname").setRequired(true))
        .addIntegerOption((o) => o.setName("preis").setDescription("Preis in $ (ohne Punkte)").setRequired(true).setMinValue(1))
        .addUserOption((o) => o.setName("verkaeufer").setDescription("Discord-Verkäufer").setRequired(true))
        .addStringOption((o) => o.setName("empfaenger").setDescription("Minecraft-Name für /pay").setRequired(true))
        .addStringOption((o) => o.setName("beschreibung").setDescription("Beschreibungstext"))
        .addStringOption((o) => o.setName("begruessung").setDescription("Begrüßung im Listing"))
        .addStringOption((o) => o.setName("warnung").setDescription("Wichtiger Hinweis"))
        .addStringOption((o) => o.setName("bild").setDescription("Bild-URL"))
        .addStringOption((o) => o.setName("sku").setDescription("Anzeige-ID, z. B. #7"))
        .addStringOption((o) => o.setName("button").setDescription("Button-Text, z. B. Map-Art kaufen"))
        .addBooleanOption((o) => o.setName("unlimitiert").setDescription("Unbegrenzt kaufbar (Standard: ja)")))
        .addSubcommand((s) => s.setName("liste").setDescription("Alle Produkte anzeigen"))
        .addSubcommand((s) => s
        .setName("entfernen")
        .setDescription("Produkt löschen")
        .addIntegerOption((o) => o.setName("id").setDescription("Produkt-ID").setRequired(true))),
    new SlashCommandBuilder()
        .setName("buy-panel")
        .setDescription("Buy-Panel für ein Produkt senden (mehrfach möglich)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addIntegerOption((o) => o.setName("produkt_id").setDescription("ID aus /produkt liste").setRequired(true))
        .addBooleanOption((o) => o.setName("listing").setDescription("Zusätzlich das lange Listing-Embed senden"))
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    new SlashCommandBuilder()
        .setName("service")
        .setDescription("Bau-/Service-Angebote verwalten")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((s) => s
        .setName("hinzufuegen")
        .setDescription("Service anlegen")
        .addStringOption((o) => o.setName("name").setDescription("z. B. Schematic Bau Service").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(true))
        .addStringOption((o) => o.setName("beschreibung").setDescription("Beschreibung").setRequired(true))
        .addStringOption((o) => o.setName("wichtig").setDescription("Wichtiger Hinweis"))
        .addIntegerOption((o) => o.setName("limit").setDescription("Max. offene Tickets").setMinValue(1)))
        .addSubcommand((s) => s.setName("liste").setDescription("Services anzeigen"))
        .addSubcommand((s) => s
        .setName("status")
        .setDescription("Service aktiv/inaktiv schalten")
        .addIntegerOption((o) => o.setName("id").setDescription("Service-ID").setRequired(true))
        .addBooleanOption((o) => o.setName("aktiv").setDescription("Verfügbar?").setRequired(true))),
    new SlashCommandBuilder()
        .setName("service-panel")
        .setDescription("Service-Panel mit Dropdown senden")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Gewinnspiele starten und auswerten")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((s) => s
        .setName("starten")
        .setDescription("Neues Giveaway posten")
        .addStringOption((o) => o.setName("titel").setDescription("z. B. Public Giveaway").setRequired(true))
        .addStringOption((o) => o.setName("gewinne").setDescription("z. B. • **2x** $2.5M").setRequired(true))
        .addStringOption((o) => o.setName("dauer").setDescription("z. B. 7h, 30m, 1d").setRequired(true))
        .addIntegerOption((o) => o.setName("gewinner").setDescription("Anzahl Gewinner").setRequired(true).setMinValue(1).setMaxValue(20))
        .addStringOption((o) => o.setName("beschreibung").setDescription("Untertitel, z. B. Daily GW"))
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
        .addSubcommand((s) => s
        .setName("beenden")
        .setDescription("Giveaway sofort auslosen")
        .addStringOption((o) => o.setName("id").setDescription("Gewinnspiel-ID").setRequired(true)))
        .addSubcommand((s) => s
        .setName("reroll")
        .setDescription("Neue Gewinner ziehen")
        .addStringOption((o) => o.setName("id").setDescription("Gewinnspiel-ID").setRequired(true))),
    new SlashCommandBuilder()
        .setName("vouch")
        .setDescription("Vouch / Bewertung erstellen")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((s) => s
        .setName("erstellen")
        .setDescription("Neuen Vouch posten")
        .addStringOption((o) => o.setName("produkt").setDescription("Produktname").setRequired(true))
        .addIntegerOption((o) => o.setName("menge").setDescription("Menge").setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName("preis").setDescription("Preis in $").setRequired(true).setMinValue(0))
        .addUserOption((o) => o.setName("kaeufer").setDescription("Käufer").setRequired(true))
        .addUserOption((o) => o.setName("verkaeufer").setDescription("Verkäufer").setRequired(true))
        .addIntegerOption((o) => o.setName("bewertung").setDescription("Sterne 1–5").setRequired(true).setMinValue(1).setMaxValue(5))
        .addStringOption((o) => o.setName("notiz").setDescription("Kurze Notiz"))
        .addStringOption((o) => o.setName("kategorie").setDescription("z. B. Spawner, Map-Art"))
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))),
    new SlashCommandBuilder()
        .setName("vouch-panel")
        .setDescription("Ein Vouch-Panel ans Kanalende (altes wird gelöscht)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Zahlungsanfrage mit berechnetem /pay-Befehl posten")
        .addStringOption((o) => o.setName("empfaenger").setDescription("Minecraft-Name des Empfängers").setRequired(true))
        .addIntegerOption((o) => o.setName("betrag").setDescription("Betrag in $").setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName("menge").setDescription("Menge (Gesamt = betrag × menge)").setMinValue(1))
        .addStringOption((o) => o.setName("produkt").setDescription("Produktname")),
    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Offenes Ticket verwalten")
        .addSubcommand((s) => s.setName("schliessen").setDescription("Dieses Ticket schließen"))
        .addSubcommand((s) => s
        .setName("preis")
        .setDescription("Preis festlegen (wenn noch keiner da ist) — zeigt /pay y3zz")
        .addStringOption((o) => o.setName("betrag").setDescription("z. B. 5,0M oder 2500000").setRequired(true))
        .addStringOption((o) => o.setName("produkt").setDescription("Bezeichnung, z. B. Support / Map"))
        .addIntegerOption((o) => o.setName("menge").setDescription("Menge").setMinValue(1).setMaxValue(999)))
        .addSubcommand((s) => s
        .setName("hinzufuegen")
        .setDescription("User zum Ticket hinzufügen")
        .addUserOption((o) => o.setName("user").setDescription("Mitglied").setRequired(true))),
    new SlashCommandBuilder()
        .setName("spawner")
        .setDescription("Spawner-Preise für das An-/Verkauf-Panel")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((s) => s
        .setName("setzen")
        .setDescription("Spawner anlegen oder Preis ändern (STOP = nicht verfügbar)")
        .addStringOption((o) => o.setName("name").setDescription("z. B. Skelly").setRequired(true))
        .addStringOption((o) => o.setName("ankauf").setDescription("Ankaufspreis, z. B. 4,0M oder STOP").setRequired(true))
        .addStringOption((o) => o.setName("verkauf").setDescription("Verkaufspreis, z. B. 5,5M oder STOP").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji fürs Panel, z. B. 💀")))
        .addSubcommand((s) => s
        .setName("hinzufuegen")
        .setDescription("Neuen Spawner ins Panel aufnehmen")
        .addStringOption((o) => o.setName("name").setDescription("z. B. Magma").setRequired(true))
        .addStringOption((o) => o.setName("ankauf").setDescription("Ankaufspreis, z. B. 4,0M oder STOP").setRequired(true))
        .addStringOption((o) => o.setName("verkauf").setDescription("Verkaufspreis, z. B. 5,5M oder STOP").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji, z. B. 🌋")))
        .addSubcommand((s) => s.setName("liste").setDescription("Alle Spawner-Preise anzeigen"))
        .addSubcommand((s) => s
        .setName("emoji")
        .setDescription("Emoji eines Spawners im Panel ändern")
        .addStringOption((o) => o.setName("name").setDescription("Spawner-Name").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Neues Emoji").setRequired(true)))
        .addSubcommand((s) => s
        .setName("entfernen")
        .setDescription("Spawner aus dem Panel löschen")
        .addStringOption((o) => o.setName("name").setDescription("Name").setRequired(true)))
        .addSubcommand((s) => s
        .setName("rolle")
        .setDescription("Eigene Support-Rolle nur für Spawner-Tickets")
        .addRoleOption((o) => o.setName("rolle").setDescription("Spawner-Team").setRequired(true))),
    new SlashCommandBuilder()
        .setName("spawner-panel")
        .setDescription("Spawner An-/Verkauf-Panel mit Buttons senden")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
        .addChannelOption((o) => o
        .setName("benachrichtigung")
        .setDescription("Kanal für den Hinweis (z. B. #BENACHRICHTIGUNG)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    new SlashCommandBuilder()
        .setName("clan")
        .setDescription("Clan-Infos, Preise, Plätze und Bewerbungen verwalten")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((s) => s.setName("anzeigen").setDescription("Stand anzeigen: Plätze, Preise, Info"))
        .addSubcommand((s) => s
        .setName("panel")
        .setDescription("Bewerbungspanel posten (Plätze, Preise, Button)")
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
        .addSubcommand((s) => s
        .setName("hinzufuegen")
        .setDescription("Clan aufs Bewerbungspanel setzen")
        .addStringOption((o) => o.setName("name").setDescription("z. B. TXTClan").setRequired(true).setMaxLength(80))
        .addIntegerOption((o) => o.setName("plaetze").setDescription("Maximum, z. B. 30").setMinValue(1).setMaxValue(500))
        .addRoleOption((o) => o.setName("rolle").setDescription("Rolle bei Annahme")))
        .addSubcommand((s) => s
        .setName("entfernen")
        .setDescription("Clan vom Panel nehmen")
        .addStringOption((o) => o.setName("name").setDescription("Name auf dem Panel").setRequired(true).setMaxLength(80)))
        .addSubcommand((s) => s
        .setName("name")
        .setDescription("Clan umbenennen")
        .addStringOption((o) => o.setName("text").setDescription("Neuer Name").setRequired(true).setMaxLength(80))
        .addStringOption((o) => o.setName("clan").setDescription("Welcher Clan, falls mehrere")))
        .addSubcommand((s) => s
        .setName("info")
        .setDescription("Clan-Beschreibung setzen (Textfenster: Markdown, Zeilenumbrüche)")
        .addStringOption((o) => o.setName("clan").setDescription("Welcher Clan, falls mehrere")))
        .addSubcommand((s) => s
        .setName("plaetze")
        .setDescription("Maximale Plätze setzen (Anzeige z. B. 4/30)")
        .addIntegerOption((o) => o.setName("anzahl").setDescription("Maximum, z. B. 30").setRequired(true).setMinValue(1).setMaxValue(500))
        .addStringOption((o) => o.setName("clan").setDescription("Welcher Clan, falls mehrere")))
        .addSubcommand((s) => s
        .setName("empfaenger")
        .setDescription("Minecraft-Empfänger für Clan-Zahlungen (/pay)")
        .addStringOption((o) => o.setName("name").setDescription("Minecraft-Name").setRequired(true).setMaxLength(32))
        .addStringOption((o) => o.setName("clan").setDescription("Welcher Clan, falls mehrere")))
        .addSubcommand((s) => s
        .setName("preis-setzen")
        .setDescription("Clan-Preis festlegen oder ändern (STOP = entfernen)")
        .addStringOption((o) => o.setName("bezeichnung").setDescription("Name der Preiszeile, z. B. Raid-Kosten").setRequired(true).setMaxLength(80))
        .addStringOption((o) => o.setName("betrag").setDescription("z. B. 5,0M — STOP entfernt die Zeile").setRequired(true)))
        .addSubcommand((s) => s.setName("preis-liste").setDescription("Alle Clan-Preise anzeigen"))
        .addSubcommand((s) => s
        .setName("preis-entfernen")
        .setDescription("Einen Clan-Preis entfernen")
        .addStringOption((o) => o.setName("bezeichnung").setDescription("Name der Preiszeile").setMaxLength(80))
        .addIntegerOption((o) => o.setName("id").setDescription("Optional: ID aus /clan preis-liste")))
        .addSubcommand((s) => s
        .setName("rolle")
        .setDescription("Rolle, die bei Annahme der Bewerbung vergeben wird")
        .addRoleOption((o) => o.setName("rolle").setDescription("Clan-Mitgliedsrolle").setRequired(true))
        .addStringOption((o) => o.setName("clan").setDescription("Welcher Clan, falls mehrere")))
        .addSubcommand((s) => s.setName("liste").setDescription("Angenommene, offene und abgelehnte Bewerbungen"))
        .addSubcommand((s) => s
        .setName("annehmen")
        .setDescription("Bewerbung annehmen (belegt 1 Platz; doppelt zählt nicht)")
        .addUserOption((o) => o.setName("user").setDescription("Bewerber").setRequired(true)))
        .addSubcommand((s) => s
        .setName("ablehnen")
        .setDescription("Bewerbung ablehnen (kein Platz)")
        .addUserOption((o) => o.setName("user").setDescription("Bewerber").setRequired(true)))
        .addSubcommand((s) => s
        .setName("kick")
        .setDescription("Mitglied entfernen — Platz wird frei")
        .addUserOption((o) => o.setName("user").setDescription("Mitglied").setRequired(true))),
    new SlashCommandBuilder()
        .setName("clan-panel")
        .setDescription("Clan-Bewerbungspanel posten (wie /clan panel)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption((o) => o.setName("kanal").setDescription("Zielkanal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    new SlashCommandBuilder().setName("help").setDescription("Alle Befehle des Bots anzeigen"),
].map((c) => c.toJSON());
export function helpText() {
    return [
        "**TXTClan Bot · Ticket, Shop, Giveaway & Vouch**",
        "Läuft auf mehreren Servern gleichzeitig — Setup und Panels gelten nur für diesen Server.",
        "",
        "**Einrichtung**",
        "`/setup setzen` — Kategorie, Team-Rolle, Pay-Empfänger",
        "`/setup anzeigen` — aktuelle Werte",
        "",
        "**Nachrichten**",
        "`/msg` — Textfenster öffnen, Nachricht eintragen, Abschicken in diesen Kanal",
        "`/sagen` · `/embed` — dasselbe Fenster, optional als Embed / mit Titel",
        "`/msg user:` — dieselbe Formatierung per DM",
        "",
        "**Tickets**",
        "`/ticket-kategorie hinzufuegen` — Anliegen anlegen",
        "`/ticket-panel` — Dropdown-Panel posten (beliebig oft)",
        "`/ticket preis` — Im Ticket ohne Preis den Betrag setzen → `/pay y3zz …`",
        "`/service` + `/service-panel` — Service-Tickets mit Limit",
        "",
        "**Shop / Buy-Panels**",
        "`/produkt erstellen` — Preis, Verkäufer, /pay-Empfänger",
        "`/buy-panel` — Kauf-Button posten (mehrere Panels möglich)",
        "`/spawner hinzufuegen` · `/spawner setzen` · `/spawner emoji` · `/spawner entfernen`",
        "`/spawner rolle` — eigene Support-Rolle für Spawner-Tickets",
        "`/spawner-panel` — Preisliste als Kacheln, An-/Verkauf mit STOP",
        "Im Ticket: Gesamtpreis × Menge und kopierbarer `/pay y3zz`-Befehl",
        "`/pay` — Zahlungsanfrage manuell posten",
        "Nach dem Kauf: Bewertung per DM (Sterne), wird als Vouch gepostet",
        "",
        "**Clan**",
        "`/clan name` · `/clan info` (formatiert) · `/clan plaetze` — Panel-Texte und Maximum (z. B. 30)",
        "`/clan preis-setzen` · `/clan preis-entfernen` · `/clan preis-liste` — Preise selbst festlegen, ändern, löschen",
        "`/clan hinzufuegen` · `/clan entfernen` — Clans aufs Panel / wieder runter",
        "`/clan panel` · `/clan-panel` — Bewerbungspanel posten",
        "`/clan rolle` — Rolle, die bei Annahme automatisch vergeben wird",
        "`/clan annehmen` · `/clan ablehnen` · `/clan kick` — Platz frei / belegt",
        "",
        "**Giveaways & Vouches**",
        "`/giveaway starten` · `/giveaway beenden` · `/giveaway reroll`",
        "`/vouch erstellen` · `/vouch-panel` — nur ein Panel, immer die letzte Nachricht im Kanal",
    ].join("\n");
}
