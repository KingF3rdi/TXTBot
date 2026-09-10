import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "data"));
fs.mkdirSync(dataDir, { recursive: true });
export const db = new DatabaseSync(path.join(dataDir, "nexus.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS guilds (
  id TEXT PRIMARY KEY,
  community_name TEXT NOT NULL DEFAULT 'TXTClan',
  footer TEXT NOT NULL DEFAULT 'TXTClan Bot',
  ticket_category_id TEXT,
  staff_role_id TEXT,
  log_channel_id TEXT,
  pay_format TEXT NOT NULL DEFAULT '/pay {empfaenger} {betrag}',
  default_pay_recipient TEXT,
  one_ticket_limit INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ticket_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'support',
  enabled INTEGER NOT NULL DEFAULT 1,
  max_open INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  important TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  max_open INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  greeting TEXT,
  warning TEXT,
  price INTEGER NOT NULL,
  seller_id TEXT NOT NULL,
  pay_recipient TEXT NOT NULL,
  image_url TEXT,
  unlimited INTEGER NOT NULL DEFAULT 1,
  stock INTEGER,
  status TEXT NOT NULL DEFAULT 'available',
  sku TEXT,
  button_label TEXT NOT NULL DEFAULT 'Kaufen'
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category_id INTEGER,
  service_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER,
  total INTEGER,
  pay_recipient TEXT,
  seller_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  claimed_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS giveaways (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prize TEXT NOT NULL,
  winners_count INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  hosted_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running'
);

CREATE TABLE IF NOT EXISTS giveaway_entries (
  giveaway_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (giveaway_id, user_id)
);

CREATE TABLE IF NOT EXISTS vouches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Shop',
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS panels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  type TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  extra TEXT
);

CREATE TABLE IF NOT EXISTS spawners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  buy_price INTEGER,
  sell_price INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clan_config (
  guild_id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'TXTClan',
  info TEXT NOT NULL DEFAULT 'Wir suchen aktive Spieler für PvP, Farm und Teamplay. Bewirb dich unten — ein Platz zählt nur einmal pro Person.',
  max_slots INTEGER NOT NULL DEFAULT 30,
  pay_recipient TEXT
);

CREATE TABLE IF NOT EXISTS clan_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  label TEXT NOT NULL,
  amount INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clan_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  ign TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  ticket_channel_id TEXT,
  ticket_id INTEGER,
  decided_by TEXT,
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  UNIQUE(guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS vouch_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  ticket_id INTEGER,
  user_id TEXT NOT NULL,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL,
  seller_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
`);
function tableColumns(table) {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    return new Set(rows.map((r) => r.name));
}
function ensureColumn(table, column, ddl) {
    if (!tableColumns(table).has(column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    }
}
ensureColumn("guilds", "spawner_staff_role_id", "spawner_staff_role_id TEXT");
ensureColumn("guilds", "vouch_channel_id", "vouch_channel_id TEXT");
ensureColumn("spawners", "emoji", "emoji TEXT NOT NULL DEFAULT '🧱'");
ensureColumn("tickets", "product_name", "product_name TEXT");
ensureColumn("clan_config", "role_id", "role_id TEXT");
export function requireGuildId(id) {
    if (!id)
        throw new Error("Dieser Bot funktioniert nur auf Servern.");
    return id;
}
export function getGuild(id) {
    const guildId = requireGuildId(id);
    const existing = db.prepare("SELECT * FROM guilds WHERE id = ?").get(guildId);
    if (existing)
        return existing;
    db.prepare("INSERT INTO guilds (id) VALUES (?)").run(guildId);
    return db.prepare("SELECT * FROM guilds WHERE id = ?").get(guildId);
}
export function updateGuild(id, patch) {
    const guildId = requireGuildId(id);
    getGuild(guildId);
    const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
    if (!entries.length)
        return getGuild(guildId);
    const sql = `UPDATE guilds SET ${entries.map(([k]) => `${k} = ?`).join(", ")} WHERE id = ?`;
    db.prepare(sql).run(...entries.map(([, v]) => v), guildId);
    return getGuild(guildId);
}
export function ensureDefaultCategories(guildId) {
    const id = requireGuildId(guildId);
    db.prepare("DELETE FROM ticket_categories WHERE guild_id = ? AND (type = 'verify' OR name = 'Verifizieren')").run(id);
    const count = db.prepare("SELECT COUNT(*) AS c FROM ticket_categories WHERE guild_id = ?").get(id);
    if (count.c > 0)
        return;
    const defaults = [
        ["Website-Support", "🔵", "Hilfe rund um Website, Login oder technische Probleme.", "support"],
        ["Allgemeiner Support", "⚪", "allgemeine Fragen und Anliegen.", "support"],
        ["Clan-Fight", "⚔️", "Anfrage für einen Clan-Fight.", "support"],
        ["Allianz-Anfrage", "🤝", "Anfrage für eine Allianz.", "support"],
        ["Giveaway", "🎉", "Anliegen rund um Gewinne oder Gewinnspiele.", "support"],
    ];
    const insert = db.prepare("INSERT INTO ticket_categories (guild_id, name, emoji, description, type, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
    defaults.forEach((row, i) => insert.run(id, ...row, i));
}
export function countOpenTickets(guildId, userId, type) {
    if (type) {
        return db
            .prepare("SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open' AND type = ?")
            .get(guildId, userId, type).c;
    }
    return db
        .prepare("SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'")
        .get(guildId, userId).c;
}
export function countOpenByService(guildId, serviceId) {
    return db
        .prepare("SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ? AND service_id = ? AND status = 'open'")
        .get(guildId, serviceId).c;
}
export const DEFAULT_SPAWNER_EMOJI = {
    Blaze: "🔥",
    Cow: "🐮",
    Creeper: "💥",
    Iron: "⚙️",
    Piglin: "🐷",
    Skelly: "💀",
    Spider: "🕷️",
};
export function listSpawners(guildId) {
    return db
        .prepare("SELECT * FROM spawners WHERE guild_id = ? ORDER BY sort_order, name")
        .all(guildId);
}
export function ensureDefaultSpawners(guildId) {
    const id = requireGuildId(guildId);
    const count = db.prepare("SELECT COUNT(*) AS c FROM spawners WHERE guild_id = ?").get(id).c;
    if (count === 0) {
        const defaults = [
            ["Blaze", 4_000_000, null, "🔥"],
            ["Cow", 4_000_000, null, "🐮"],
            ["Creeper", 3_500_000, 5_500_000, "💥"],
            ["Iron", 8_000_000, null, "⚙️"],
            ["Piglin", 4_000_000, null, "🐷"],
            ["Skelly", 13_100_000, 14_000_000, "💀"],
            ["Spider", 4_000_000, null, "🕷️"],
        ];
        const insert = db.prepare("INSERT INTO spawners (guild_id, name, buy_price, sell_price, sort_order, emoji) VALUES (?, ?, ?, ?, ?, ?)");
        defaults.forEach((row, i) => insert.run(id, row[0], row[1], row[2], i, row[3]));
    }
    backfillSpawnerEmojis(id);
}
export function backfillSpawnerEmojis(guildId) {
    const rows = listSpawners(guildId);
    const upd = db.prepare("UPDATE spawners SET emoji = ? WHERE id = ?");
    for (const row of rows) {
        if (row.emoji && row.emoji !== "🧱")
            continue;
        const mapped = DEFAULT_SPAWNER_EMOJI[row.name];
        if (mapped)
            upd.run(mapped, row.id);
    }
}
db.exec(`
CREATE TABLE IF NOT EXISTS clans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  info TEXT NOT NULL DEFAULT 'Wir suchen aktive Spieler für PvP, Farm und Teamplay. Bewirb dich unten — ein Platz zählt nur einmal pro Person.',
  max_slots INTEGER NOT NULL DEFAULT 30,
  pay_recipient TEXT,
  role_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(guild_id, name)
);
`);
ensureColumn("clan_applications", "clan_id", "clan_id INTEGER");
ensureColumn("clans", "price", "price REAL");
function seedClansFromConfig() {
    const configs = db.prepare("SELECT * FROM clan_config").all();
    const insert = db.prepare("INSERT INTO clans (guild_id, name, info, max_slots, pay_recipient, role_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, 0)");
    for (const c of configs) {
        const n = db.prepare("SELECT COUNT(*) AS c FROM clans WHERE guild_id = ?").get(c.guild_id).c;
        if (n > 0)
            continue;
        const result = insert.run(c.guild_id, c.name, c.info, c.max_slots, c.pay_recipient, c.role_id);
        db.prepare("UPDATE clan_applications SET clan_id = ? WHERE guild_id = ? AND clan_id IS NULL").run(result.lastInsertRowid, c.guild_id);
    }
}
seedClansFromConfig();
db.prepare("UPDATE guilds SET community_name = 'TXTClan' WHERE community_name IN ('Community', 'FriendsWithMoney')").run();
db.prepare("UPDATE guilds SET footer = 'TXTClan Bot' WHERE footer IN ('Ticket- & Shop-System')").run();
db.prepare("UPDATE clans SET name = 'TXTClan' WHERE name = 'FriendsWithMoney' AND NOT EXISTS (SELECT 1 FROM clans o WHERE o.guild_id = clans.guild_id AND o.name = 'TXTClan')").run();
db.prepare("UPDATE clan_config SET name = 'TXTClan' WHERE name = 'FriendsWithMoney'").run();
/** Früher automatisch gesetzte Demo-Preise — Staff legt Preise selbst fest. */
db.prepare("DELETE FROM clan_prices WHERE lower(label) IN ('eintritt', 'wöchentliche abgabe')").run();
export function listClans(guildId) {
    const id = requireGuildId(guildId);
    return db.prepare("SELECT * FROM clans WHERE guild_id = ? ORDER BY sort_order, name").all(id);
}
export function getClanById(guildId, clanId) {
    return db.prepare("SELECT * FROM clans WHERE id = ? AND guild_id = ?").get(clanId, guildId);
}
export function resolveClan(guildId, name) {
    const all = listClans(guildId);
    if (name?.trim()) {
        const found = all.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
        if (!found) {
            throw new Error(`Clan **${name}** steht nicht auf dem Panel.` +
                (all.length ? ` Vorhanden: ${all.map((c) => `**${c.name}**`).join(", ")}.` : " Lege einen mit `/panel hinzufuegen` an."));
        }
        return found;
    }
    if (all.length === 1)
        return all[0];
    if (!all.length)
        throw new Error("Kein Clan auf dem Panel. `/panel hinzufuegen name:…`");
    throw new Error(`Mehrere Clans — Option \`clan:\` setzen (${all.map((c) => c.name).join(", ")}).`);
}
export function insertClan(guildId, opts) {
    const name = opts.name.trim();
    if (!name)
        throw new Error("Clan-Name fehlt.");
    const existing = db
        .prepare("SELECT id FROM clans WHERE guild_id = ? AND lower(name) = lower(?)")
        .get(guildId, name);
    if (existing)
        throw new Error(`**${name}** ist schon auf dem Panel. \`/panel entfernen name:${name}\` zum Löschen.`);
    const max = opts.max_slots ?? 30;
    db.prepare("INSERT INTO clans (guild_id, name, info, max_slots, pay_recipient, role_id, price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, 99)").run(guildId, name, opts.info ||
        "Wir suchen aktive Spieler für PvP, Farm und Teamplay. Bewirb dich unten — ein Platz zählt nur einmal pro Person.", max, opts.pay_recipient ?? null, opts.role_id ?? null, opts.price ?? null);
    return resolveClan(guildId, name);
}
export function deleteClan(guildId, clan) {
    db.prepare("DELETE FROM clan_applications WHERE guild_id = ? AND clan_id = ?").run(guildId, clan.id);
    db.prepare("DELETE FROM clans WHERE id = ? AND guild_id = ?").run(clan.id, guildId);
}
export function deleteAllClans(guildId) {
    const count = db.prepare("SELECT COUNT(*) AS c FROM clans WHERE guild_id = ?").get(guildId).c;
    db.prepare("DELETE FROM clan_applications WHERE guild_id = ?").run(guildId);
    db.prepare("DELETE FROM clans WHERE guild_id = ?").run(guildId);
    return count;
}
export function updateClanRow(clanId, guildId, patch) {
    const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
    if (!entries.length)
        return getClanById(guildId, clanId);
    const sql = `UPDATE clans SET ${entries.map(([k]) => `${k} = ?`).join(", ")} WHERE id = ? AND guild_id = ?`;
    db.prepare(sql).run(...entries.map(([, v]) => v), clanId, guildId);
    return getClanById(guildId, clanId);
}
export function countAcceptedClanMembers(guildId, clanId) {
    if (clanId != null) {
        return db
            .prepare("SELECT COUNT(DISTINCT user_id) AS c FROM clan_applications WHERE guild_id = ? AND clan_id = ? AND status = 'accepted'")
            .get(guildId, clanId).c;
    }
    return db
        .prepare("SELECT COUNT(DISTINCT user_id) AS c FROM clan_applications WHERE guild_id = ? AND status = 'accepted'")
        .get(guildId).c;
}
