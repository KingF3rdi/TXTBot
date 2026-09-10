import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Events } from "discord.js";
import { client } from "./client.js";
import { commands } from "./commands.js";
import { handleButton, handleChatCommand, handleModal, handleSelect, handleUserSelect, refreshAllServicePanels, tickGiveaways } from "./handlers.js";
import { refreshAllSpawnerPanels } from "./spawners.js";
import { refreshAllClanPanels } from "./clan.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ quiet: true });
dotenv.config({ path: path.resolve(here, "../../.env"), quiet: true });
dotenv.config({ path: path.resolve(here, "../.env"), quiet: true });

const token = process.env.DISCORD_TOKEN;

function isDisallowedIntents(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("disallowed intents") || message.includes("Used disallowed intents");
}

function printIntentsHelp() {
  console.error(`
┌─────────────────────────────────────────────────────────────┐
│  Discord: Used disallowed intents (Code 4014)               │
│                                                             │
│  Developer Portal → https://discord.com/developers          │
│  Anwendung wählen → Bot → Privileged Gateway Intents:       │
│    Presence Intent          AUS                             │
│    Server Members Intent    AUS                             │
│    Message Content Intent   AUS                             │
│  Speichern, dann den Host neu starten.                      │
│  Dieser Build sendet nur den Intent Guilds.                 │
└─────────────────────────────────────────────────────────────┘
`);
}

process.on("uncaughtException", (err) => {
  if (isDisallowedIntents(err)) {
    printIntentsHelp();
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});

if (!token) {
  console.error(`
┌─────────────────────────────────────────────────────────────┐
│  DISCORD_TOKEN fehlt. Der Bot kann sich nicht verbinden.    │
│                                                             │
│  1. https://discord.com/developers/applications             │
│  2. Bot anlegen → Token kopieren                            │
│  3. DISCORD_TOKEN im Host als Umgebungsvariable setzen      │
│     oder lokal in .env speichern                            │
│  4. node index.js  (Bot-Host: Startup-Datei = index.js)     │
│                                                             │
│  Die Web-Vorschau läuft unabhängig davon: npm run dev       │
└─────────────────────────────────────────────────────────────┘
`);
  process.exit(1);
}

async function registerCommands() {
  const names = commands.map((c) => ("name" in c ? c.name : "?")).join(", ");
  console.log(`Registriere ${commands.length} Befehle: ${names}`);
  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.commands.set(commands);
      console.log(`Slash-Befehle für Server "${guild.name}" gesetzt (${commands.length}, inkl. /clan panel).`);
    } catch (err) {
      console.error(`Befehle für ${guild.name} fehlgeschlagen:`, err);
    }
  }
  try {
    await client.application!.commands.set(commands);
    console.log("Globale Slash-Befehle gesetzt.");
  } catch (err) {
    console.error("Globale Befehle konnten nicht registriert werden:", err);
  }
}

client.once(Events.ClientReady, async (ready) => {
  console.log(`[TXTClan] Online als ${ready.user.tag} · Intents ${client.options.intents?.bitfield ?? 1}`);
  ready.user.setPresence({
    activities: [{ name: "TXTClan Bot", type: 3 }],
    status: "online",
  });
  await registerCommands();
  await refreshAllSpawnerPanels(client).catch((err) => console.error("Spawner-Panels konnten nicht aktualisiert werden:", err));
  await refreshAllClanPanels(client).catch((err) => console.error("Clan-Panels konnten nicht aktualisiert werden:", err));
  await refreshAllServicePanels(client).catch((err) => console.error("Service-Panels konnten nicht aktualisiert werden:", err));
  setInterval(() => tickGiveaways(client), 15_000);
});

client.on(Events.GuildCreate, async (guild) => {
  try {
    await guild.commands.set(commands);
    console.log(`Slash-Befehle für neuen Server "${guild.name}" gesetzt.`);
  } catch (err) {
    console.error(`Befehle für ${guild.name} fehlgeschlagen:`, err);
  }
});

client.on(Events.Error, (err) => {
  console.error("Discord-Fehler:", err.message);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleChatCommand(interaction);
      return;
    }
    if (interaction.isButton()) {
      await handleButton(interaction);
      return;
    }
    if (interaction.isStringSelectMenu()) {
      await handleSelect(interaction);
      return;
    }
    if (interaction.isUserSelectMenu()) {
      await handleUserSelect(interaction);
      return;
    }
    if (interaction.isModalSubmit()) {
      await handleModal(interaction);
    }
  } catch (err) {
    console.error(err);
    const payload = { content: "Da ist etwas schiefgelaufen.", flags: 64 };
    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => undefined);
      else await interaction.reply(payload).catch(() => undefined);
    }
  }
});

console.log("[TXTClan] 1.0.17 start · Gateway-Intents: Guilds only");
client.login(token).catch((err: unknown) => {
  if (isDisallowedIntents(err)) printIntentsHelp();
  else console.error(err);
  process.exit(1);
});

