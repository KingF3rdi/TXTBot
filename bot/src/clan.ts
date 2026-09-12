import {
  ActionRowBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  type Guild,
  ModalBuilder,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  countAcceptedClanMembers,
  db,
  deleteAllClans,
  deleteClan,
  getClanById,
  getGuild,
  insertClan,
  listClans,
  requireGuildId,
  resolveClan,
  updateClanRow,
} from "./db.js";
import { clanPanelComponents, clanPanelEmbed, clanTicketControls, paymentEmbed, ticketControls } from "./embeds.js";
import { COLORS, formatMillions, formatMoney, formatUserText, parsePrice, shopPayRecipient } from "./util.js";
import { createTicketChannel, insertTicket, isStaff, resolveTextChannel } from "./tickets.js";

function panelClans(guildId: string) {
  return listClans(guildId).map((c) => ({ ...c, filled: countAcceptedClanMembers(guildId, c.id) }));
}

function panelPayload(guildId: string) {
  const config = getGuild(guildId);
  const clans = panelClans(guildId);
  return {
    embeds: [clanPanelEmbed(config, clans)],
    components: clanPanelComponents(clans),
  };
}

async function syncClanRole(guild: Guild | null, userId: string, add: boolean, roleId?: string | null) {
  if (!guild) return "";
  if (!roleId) {
    return add ? " Keine Clan-Rolle gesetzt — `/panel rolle`." : "";
  }
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return ` Mitglied <@${userId}> nicht auf dem Server, Rolle nicht ${add ? "vergeben" : "entfernt"}.`;
  try {
    if (add) {
      if (!member.roles.cache.has(roleId)) {
        await member.roles.add(roleId, "Clan-Bewerbung angenommen");
      }
      return ` Rolle <@&${roleId}> vergeben.`;
    }
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId, "Clan-Platz entfernt");
    }
    return ` Rolle <@&${roleId}> entfernt.`;
  } catch {
    return " Rolle konnte nicht geändert werden — Bot braucht **Rollen verwalten** und muss **über** der Clan-Rolle stehen.";
  }
}

export async function refreshClanPanels(client: Client, guildId: string) {
  const rows = db
    .prepare("SELECT channel_id, message_id FROM panels WHERE guild_id = ? AND type = 'clan'")
    .all(guildId) as { channel_id: string; message_id: string }[];
  const payload = panelPayload(guildId);
  for (const row of rows) {
    const ch = await client.channels.fetch(row.channel_id).catch(() => null);
    if (!ch || !ch.isTextBased() || !("messages" in ch)) continue;
    const msg = await ch.messages.fetch(row.message_id).catch(() => null);
    await msg?.edit(payload).catch(() => undefined);
  }
}

export async function refreshAllClanPanels(client: Client) {
  const rows = db.prepare("SELECT DISTINCT guild_id FROM panels WHERE type = 'clan'").all() as { guild_id: string }[];
  for (const row of rows) {
    await refreshClanPanels(client, row.guild_id);
  }
}

export async function cmdClan(interaction: ChatInputCommandInteraction) {
  const guildId = requireGuildId(interaction.guildId);
  const sub = interaction.options.getSubcommand();
  const which = interaction.options.getString("clan");

  if (sub === "panel") {
    await cmdClanPanel(interaction);
    return;
  }

  if (sub === "hinzufuegen") {
    const name = interaction.options.getString("name", true);
    const max = interaction.options.getInteger("plaetze") ?? 30;
    const role = interaction.options.getRole("rolle");
    const rawPreis = interaction.options.getString("preis");
    const price = rawPreis ? parsePrice(rawPreis) : null;
    if (rawPreis && (price == null || price <= 0)) throw new Error("Preis konnte nicht gelesen werden, z. B. `5,0M`.");
    const clan = insertClan(guildId, { name, max_slots: max, role_id: role?.id ?? null, price });
    await refreshClanPanels(interaction.client, guildId);
    await interaction.reply({
      content: `**${clan.name}** steht jetzt auf dem Panel (${max} Plätze${price != null ? `, ${formatMillions(price)}` : ""}). Entfernen: \`/panel entfernen name:${clan.name}\`.`,
      flags: 64,
    });
    return;
  }

  if (sub === "entfernen") {
    const clan = resolveClan(guildId, interaction.options.getString("name", true));
    deleteClan(guildId, clan);
    await refreshClanPanels(interaction.client, guildId);
    await interaction.reply({
      content: `**${clan.name}** ist vom Panel runter. Offene Bewerbungen für diesen Clan wurden gelöscht.`,
      flags: 64,
    });
    return;
  }

  if (sub === "alle-entfernen") {
    const confirm = interaction.options.getString("bestaetigung", true).trim().toUpperCase();
    if (confirm !== "ENTFERNEN") {
      throw new Error("Zur Bestätigung `bestaetigung:ENTFERNEN` angeben — löscht **alle** Clans unwiderruflich.");
    }
    const count = deleteAllClans(guildId);
    await refreshClanPanels(interaction.client, guildId);
    await interaction.reply({
      content: `**${count}** Clan(s) entfernt, samt aller Bewerbungen. Panel ist jetzt leer.`,
      flags: 64,
    });
    return;
  }

  if (sub === "preis") {
    const clan = resolveClan(guildId, which);
    const raw = interaction.options.getString("betrag", true);
    if (raw.trim().toUpperCase() === "STOP") {
      updateClanRow(clan.id, guildId, { price: null });
      await refreshClanPanels(interaction.client, guildId);
      await interaction.reply({ content: `Preis für **${clan.name}** entfernt.`, flags: 64 });
      return;
    }
    const amount = parsePrice(raw);
    if (amount == null || amount <= 0) throw new Error("Betrag konnte nicht gelesen werden, z. B. `5,0M` (oder STOP zum Entfernen).");
    updateClanRow(clan.id, guildId, { price: amount });
    await refreshClanPanels(interaction.client, guildId);
    await interaction.reply({
      content: `Preis für **${clan.name}** ist jetzt \`${formatMillions(amount)}\` (${formatMoney(amount)}). Panel aktualisiert.`,
      flags: 64,
    });
    return;
  }

  if (sub === "anzeigen") {
    const clans = panelClans(guildId);
    const body =
      clans
        .map(
          (c) =>
            `• **${c.name}** · ${c.filled}/${c.max_slots}` +
            (c.role_id ? ` · <@&${c.role_id}>` : " · _keine Rolle_") +
            ` · ${c.price != null ? formatMillions(c.price) : "_kein Preis_"}`,
        )
        .join("\n") || "_Keine Clans. `/panel hinzufuegen`_";
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.green)
          .setTitle("Clans auf dem Panel")
          .setDescription(body),
      ],
      flags: 64,
    });
    return;
  }

  if (sub === "name") {
    const clan = resolveClan(guildId, which);
    const name = interaction.options.getString("text", true);
    updateClanRow(clan.id, guildId, { name });
    await refreshClanPanels(interaction.client, guildId);
    await interaction.reply({ content: `Clan-Name ist jetzt **${name}**.`, flags: 64 });
    return;
  }

  if (sub === "info") {
    const clan = resolveClan(guildId, which);
    const modal = new ModalBuilder().setCustomId(`clan:info:${clan.id}`).setTitle(`Info · ${clan.name}`.slice(0, 45));
    const input = new TextInputBuilder()
      .setCustomId("text")
      .setLabel("Text  ·  **fett**  *kursiv*  __unter__")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1800)
      .setPlaceholder("**TXTClan**\nWir suchen aktive Member.");
    const existing = clan.info?.trim();
    if (existing) input.setValue(existing.slice(0, 1800));
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await interaction.showModal(modal);
    return;
  }

  if (sub === "plaetze") {
    const clan = resolveClan(guildId, which);
    const max = interaction.options.getInteger("anzahl", true);
    updateClanRow(clan.id, guildId, { max_slots: max });
    await refreshClanPanels(interaction.client, guildId);
    const filled = countAcceptedClanMembers(guildId, clan.id);
    await interaction.reply({ content: `**${clan.name}:** **${filled}/${max}**.`, flags: 64 });
    return;
  }

  if (sub === "empfaenger") {
    const clan = resolveClan(guildId, which);
    const name = interaction.options.getString("name", true);
    updateClanRow(clan.id, guildId, { pay_recipient: name });
    await interaction.reply({
      content: `Pay-Empfänger für **${clan.name}** ist \`${name}\`.`,
      flags: 64,
    });
    return;
  }

  if (sub === "rolle") {
    const clan = resolveClan(guildId, which);
    const role = interaction.options.getRole("rolle", true);
    updateClanRow(clan.id, guildId, { role_id: role.id });
    await refreshClanPanels(interaction.client, guildId);
    await interaction.reply({
      content: `Rolle für **${clan.name}** ist ${role}. Wird bei Annahme vergeben.`,
      flags: 64,
    });
    return;
  }

  if (sub === "liste") {
    const rows = db
      .prepare(
        `SELECT a.user_id, a.ign, a.status, c.name AS clan_name
         FROM clan_applications a
         LEFT JOIN clans c ON c.id = a.clan_id
         WHERE a.guild_id = ?
         ORDER BY a.status, a.id`,
      )
      .all(guildId) as { user_id: string; ign: string | null; status: string; clan_name: string | null }[];
    const line = (s: string) =>
      rows
        .filter((r) => r.status === s)
        .map((r) => `• <@${r.user_id}>${r.ign ? ` (\`${r.ign}\`)` : ""}${r.clan_name ? ` · ${r.clan_name}` : ""}`)
        .join("\n") || "_—_";
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.green)
          .setTitle("Bewerbungen")
          .addFields(
            { name: "✅ Angenommen (zählen)", value: line("accepted").slice(0, 1024) },
            { name: "⏳ Offen", value: line("pending").slice(0, 1024) },
            { name: "❌ Abgelehnt", value: line("rejected").slice(0, 1024) },
          ),
      ],
      flags: 64,
    });
    return;
  }

  const target = interaction.options.getUser("user", true);
  if (sub === "annehmen") {
    await setApplicationStatus(interaction, guildId, target.id, "accepted");
    return;
  }
  if (sub === "ablehnen") {
    await setApplicationStatus(interaction, guildId, target.id, "rejected");
    return;
  }
  await setApplicationStatus(interaction, guildId, target.id, "removed");
}

async function setApplicationStatus(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  guildId: string,
  userId: string,
  status: "accepted" | "rejected" | "removed",
) {
  const config = getGuild(guildId);
  const member = interaction.member;
  if (!member || typeof member === "string" || !isStaff(member, config)) {
    throw new Error("Nur das Team kann Bewerbungen entscheiden.");
  }
  const existing = db
    .prepare("SELECT status, clan_id FROM clan_applications WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId) as { status: string; clan_id: number | null } | undefined;
  const clan = existing?.clan_id ? getClanById(guildId, existing.clan_id) : listClans(guildId)[0];
  const clanId = clan?.id ?? existing?.clan_id ?? null;
  const filledOf = (id: number | null | undefined) => countAcceptedClanMembers(guildId, id ?? undefined);

  if (status === "removed") {
    const wasAccepted = existing?.status === "accepted";
    db.prepare("DELETE FROM clan_applications WHERE guild_id = ? AND user_id = ?").run(guildId, userId);
    await refreshClanPanels(interaction.client, guildId);
    const filled = filledOf(clanId);
    const roleNote = wasAccepted ? await syncClanRole(interaction.guild, userId, false, clan?.role_id) : "";
    await interaction.reply({
      content: `<@${userId}> ist raus${clan ? ` aus **${clan.name}**` : ""}. Plätze **${filled}${clan ? `/${clan.max_slots}` : ""}**.${roleNote}`,
    });
    return;
  }

  if (status === "accepted") {
    if (!clan) throw new Error("Kein Clan für diese Bewerbung. `/panel hinzufuegen`.");
    const filled = countAcceptedClanMembers(guildId, clan.id);
    const already = existing?.status === "accepted";
    if (!already && filled >= clan.max_slots) throw new Error(`**${clan.name}** ist voll (${filled}/${clan.max_slots}).`);
    if (!existing) {
      db.prepare(
        "INSERT INTO clan_applications (guild_id, user_id, clan_id, status, decided_by, created_at, decided_at) VALUES (?, ?, ?, 'accepted', ?, ?, ?)",
      ).run(guildId, userId, clan.id, interaction.user.id, Date.now(), Date.now());
    } else if (existing.status !== "accepted") {
      db.prepare(
        "UPDATE clan_applications SET status = 'accepted', clan_id = ?, decided_by = ?, decided_at = ? WHERE guild_id = ? AND user_id = ?",
      ).run(clan.id, interaction.user.id, Date.now(), guildId, userId);
    }
    await refreshClanPanels(interaction.client, guildId);
    const now = countAcceptedClanMembers(guildId, clan.id);
    const extra = already ? " War bereits angenommen — Platz wurde **nicht** doppelt gezählt." : "";
    const roleNote = await syncClanRole(interaction.guild, userId, true, clan.role_id);
    await interaction.reply({
      content: `<@${userId}> angenommen in **${clan.name}**. Plätze **${now}/${clan.max_slots}**.${extra}${roleNote}`,
    });
    return;
  }

  if (!existing) throw new Error("Keine Bewerbung für diese Person.");
  const wasAccepted = existing.status === "accepted";
  db.prepare(
    "UPDATE clan_applications SET status = 'rejected', decided_by = ?, decided_at = ? WHERE guild_id = ? AND user_id = ?",
  ).run(interaction.user.id, Date.now(), guildId, userId);
  await refreshClanPanels(interaction.client, guildId);
  const filled = filledOf(clanId);
  const roleNote = wasAccepted ? await syncClanRole(interaction.guild, userId, false, clan?.role_id) : "";
  await interaction.reply({
    content: `<@${userId}> abgelehnt${clan ? ` · **${clan.name}**` : ""}. Plätze **${filled}${clan ? `/${clan.max_slots}` : ""}**.${roleNote}`,
  });
}

export async function cmdClanPanel(interaction: ChatInputCommandInteraction) {
  const guildId = requireGuildId(interaction.guildId);
  const channel = await resolveTextChannel(interaction);
  const payload = panelPayload(guildId);
  const msg = await channel.send(payload);
  db.prepare("INSERT INTO panels (guild_id, type, channel_id, message_id) VALUES (?, 'clan', ?, ?)").run(
    guildId,
    channel.id,
    msg.id,
  );
  const clans = panelClans(guildId);
  const summary = clans.map((c) => `${c.name} ${c.filled}/${c.max_slots}`).join(" · ") || "keine Clans";
  await interaction.reply({
    content: `Clan-Panel in ${channel} · ${summary}\nClans runternehmen: \`/panel entfernen name:…\``,
    flags: 64,
  });
}

export async function openClanApplyModal(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  clanId?: number,
) {
  const guildId = requireGuildId(interaction.guildId);
  const clan =
    clanId != null
      ? getClanById(guildId, clanId)
      : interaction.isStringSelectMenu()
        ? getClanById(guildId, Number(interaction.values[0]))
        : listClans(guildId)[0];
  if (!clan) throw new Error("Dieser Clan ist nicht mehr auf dem Panel.");
  const filled = countAcceptedClanMembers(guildId, clan.id);
  if (filled >= clan.max_slots) throw new Error(`**${clan.name}** ist voll (${filled}/${clan.max_slots}).`);
  const existing = db
    .prepare("SELECT status, ticket_channel_id FROM clan_applications WHERE guild_id = ? AND user_id = ?")
    .get(guildId, interaction.user.id) as { status: string; ticket_channel_id: string | null } | undefined;
  if (existing?.status === "accepted") {
    throw new Error("Du bist bereits in einem Clan. Dein Platz ist gezählt — eine zweite Bewerbung ändert die Zahl nicht.");
  }
  if (existing?.status === "pending") {
    throw new Error(
      existing.ticket_channel_id
        ? `Du hast schon eine offene Bewerbung: <#${existing.ticket_channel_id}>`
        : "Du hast schon eine offene Bewerbung.",
    );
  }
  const modal = new ModalBuilder().setCustomId(`clan:apply:${clan.id}`).setTitle(`Bewerbung · ${clan.name}`.slice(0, 45));
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("ign")
        .setLabel("Minecraft-Name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(32),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("note")
        .setLabel("Kurz über dich (PvP, Farm, …)")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(500),
    ),
  );
  await interaction.showModal(modal);
}

export async function submitClanInfo(interaction: ModalSubmitInteraction) {
  const guildId = requireGuildId(interaction.guildId);
  const clanId = Number(interaction.customId.split(":")[2]);
  const clan = Number.isInteger(clanId) ? getClanById(guildId, clanId) : listClans(guildId)[0];
  if (!clan) throw new Error("Clan nicht gefunden.");
  const info = formatUserText(interaction.fields.getTextInputValue("text"));
  if (!info.trim()) throw new Error("Clan-Info ist leer.");
  updateClanRow(clan.id, guildId, { info });
  await refreshClanPanels(interaction.client, guildId);
  await interaction.reply({
    content: `Info für **${clan.name}** gespeichert. Panel aktualisiert.`,
    flags: 64,
  });
}

export async function submitClanApplication(interaction: ModalSubmitInteraction) {
  const guildId = requireGuildId(interaction.guildId);
  const fromId = Number(interaction.customId.split(":")[2]);
  const clan = Number.isInteger(fromId) && fromId > 0 ? getClanById(guildId, fromId) : listClans(guildId)[0];
  if (!clan) throw new Error("Dieser Clan ist nicht mehr auf dem Panel.");
  const config = getGuild(guildId);
  const filled = countAcceptedClanMembers(guildId, clan.id);
  if (filled >= clan.max_slots) throw new Error(`**${clan.name}** ist voll (${filled}/${clan.max_slots}).`);
  const ign = interaction.fields.getTextInputValue("ign").trim();
  const note = interaction.fields.getTextInputValue("note").trim() || "—";
  const existing = db
    .prepare("SELECT status FROM clan_applications WHERE guild_id = ? AND user_id = ?")
    .get(guildId, interaction.user.id) as { status: string } | undefined;
  if (existing?.status === "accepted") throw new Error("Du bist bereits im Clan.");
  if (existing?.status === "pending") throw new Error("Du hast schon eine offene Bewerbung.");

  const shopPay = shopPayRecipient(clan.pay_recipient || config.default_pay_recipient);
  const price = clan.price ?? null;
  const member = await interaction.guild!.members.fetch(interaction.user.id);
  const channel = await createTicketChannel({
    guild: interaction.guild!,
    config,
    member,
    prefix: "clan",
    topic: `Clan-Bewerbung ${ign} · ${interaction.user.tag}`,
  });
  const ticketId = insertTicket({
    guild_id: guildId,
    channel_id: channel.id,
    user_id: interaction.user.id,
    type: "clan",
    quantity: 1,
    unit_price: price,
    total: price,
    pay_recipient: shopPay,
    product_name: price != null ? `Clan-Eintritt · ${clan.name}` : null,
  });
  const now = Date.now();
  if (existing) {
    db.prepare(
      `UPDATE clan_applications SET ign = ?, note = ?, status = 'pending', clan_id = ?, ticket_channel_id = ?, ticket_id = ?,
       decided_by = NULL, decided_at = NULL, created_at = ? WHERE guild_id = ? AND user_id = ?`,
    ).run(ign, note, clan.id, channel.id, ticketId, now, guildId, interaction.user.id);
  } else {
    db.prepare(
      `INSERT INTO clan_applications (guild_id, user_id, clan_id, ign, note, status, ticket_channel_id, ticket_id, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    ).run(guildId, interaction.user.id, clan.id, ign, note, channel.id, ticketId, now);
  }

  const embeds = [
    new EmbedBuilder()
      .setColor(COLORS.green)
      .setTitle(`🤝 Bewerbung · ${clan.name}`)
      .setDescription(
        `Hallo ${member}\n\n**Plätze aktuell:** ${filled}/${clan.max_slots} — nach Annahme zählt diese Person **einmal**.`,
      )
      .addFields(
        { name: "Minecraft", value: `\`${ign}\``, inline: true },
        { name: "Discord", value: `${member}`, inline: true },
        { name: "Über dich", value: note.slice(0, 1024) },
      )
      .setFooter({ text: `${config.community_name} · Clan-Bewerbung` }),
  ];
  if (price != null) {
    embeds.push(
      paymentEmbed({
        config,
        productName: `Clan-Eintritt · ${clan.name}`,
        quantity: 1,
        unitPrice: price,
        total: price,
        sellerId: interaction.client.user.id,
        payRecipient: shopPay,
        buyerId: interaction.user.id,
        sku: "Clan",
      }),
    );
  }
  await channel.send({
    content: `${member}${config.staff_role_id ? ` · <@&${config.staff_role_id}>` : ""}`,
    embeds,
    components: [clanTicketControls(interaction.user.id), ticketControls(ticketId, { hasPay: price != null })],
  });
  await interaction.reply({
    content: `Bewerbung offen: ${channel}\nPlätze unverändert **${filled}/${clan.max_slots}** bis zur Annahme.`,
    flags: 64,
  });
}

export async function handleClanDecision(interaction: ButtonInteraction, action: string, userId: string) {
  const guildId = requireGuildId(interaction.guildId);
  const status = action === "accept" ? "accepted" : action === "kick" ? "removed" : "rejected";
  await setApplicationStatus(interaction, guildId, userId, status);
}
