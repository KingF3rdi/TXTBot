import { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
import { buyButton, customEmbed, footer, giveawayEmbed, giveawayJoinButton, paymentEmbed, productBuyEmbed, productListingEmbed, servicePanelEmbed, serviceSelect, serviceTicketControls, ticketControls, ticketPanelEmbed, ticketSelect, vouchEmbed, warningEmbed, winnersEmbed, } from "./embeds.js";
import { countOpenByService, db, ensureDefaultCategories, getGuild, requireGuildId, updateGuild, } from "./db.js";
import { COLORS, formatMoney, parseColor, parseDuration, parsePrice, payCommand, shopPayRecipient, shortId, stars, formatUserText, } from "./util.js";
import { assertCanOpenSupportTicket, assertServiceCapacity, createTicketChannel, getTicketByChannel, insertTicket, isStaff, resolveTextChannel, staffMention, } from "./tickets.js";
import { helpText } from "./commands.js";
import { cmdSpawner, cmdSpawnerPanel, openSpawnerPicker, openSpawnerQtyModal, openSpawnerTicket } from "./spawners.js";
import { cmdClan, cmdClanPanel, handleClanDecision, openClanApplyModal, submitClanApplication, submitClanInfo, } from "./clan.js";
import { handleVouchDmButton, sendVouchDm } from "./vouch-dm.js";
import { keepVouchPanelAtBottom, placeVouchPanel } from "./vouch-panel.js";
async function replyError(interaction, message) {
    const payload = { embeds: [warningEmbed(message, COLORS.red)], flags: 64 };
    if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload);
    }
    else {
        await interaction.reply(payload);
    }
}
export async function handleChatCommand(interaction) {
    if (!interaction.inGuild()) {
        await interaction.reply({ content: "Dieser Bot funktioniert nur auf Servern.", flags: 64 });
        return;
    }
    const name = interaction.commandName;
    try {
        switch (name) {
            case "setup":
                await cmdSetup(interaction);
                break;
            case "sagen":
                await cmdSay(interaction);
                break;
            case "msg":
                await cmdMsg(interaction);
                break;
            case "embed":
                await cmdEmbed(interaction);
                break;
            case "ticket-kategorie":
                await cmdTicketCategory(interaction);
                break;
            case "ticket-panel":
                await cmdTicketPanel(interaction);
                break;
            case "produkt":
                await cmdProduct(interaction);
                break;
            case "buy-panel":
                await cmdBuyPanel(interaction);
                break;
            case "service":
                await cmdService(interaction);
                break;
            case "service-panel":
                await cmdServicePanel(interaction);
                break;
            case "giveaway":
                await cmdGiveaway(interaction);
                break;
            case "vouch":
                await cmdVouch(interaction);
                break;
            case "vouch-panel":
                await cmdVouchPanel(interaction);
                break;
            case "spawner":
                await cmdSpawner(interaction);
                break;
            case "spawner-panel":
                await cmdSpawnerPanel(interaction);
                break;
            case "panel":
                await cmdClan(interaction);
                break;
            case "panel-panel":
                await cmdClanPanel(interaction);
                break;
            case "pay":
                await cmdPay(interaction);
                break;
            case "ticket":
                await cmdTicket(interaction);
                break;
            case "help":
                await interaction.reply({
                    embeds: [new EmbedBuilder().setColor(COLORS.green).setDescription(helpText())],
                    flags: 64,
                });
                break;
            default:
                await interaction.reply({ content: "Unbekannter Befehl.", flags: 64 });
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
        await replyError(interaction, message);
    }
}
async function cmdSetup(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "anzeigen") {
        const g = getGuild(interaction.guildId);
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(COLORS.green)
                    .setTitle("Server-Setup")
                    .addFields({ name: "Community", value: g.community_name, inline: true }, { name: "Footer", value: g.footer, inline: true }, { name: "Ticket-Kategorie", value: g.ticket_category_id ? `<#${g.ticket_category_id}>` : "—", inline: true }, { name: "Team-Rolle", value: g.staff_role_id ? `<@&${g.staff_role_id}>` : "—", inline: true }, { name: "Spawner-Rolle", value: g.spawner_staff_role_id ? `<@&${g.spawner_staff_role_id}>` : "—", inline: true }, { name: "Log-Kanal", value: g.log_channel_id ? `<#${g.log_channel_id}>` : "—", inline: true }, { name: "Vouch-Kanal", value: g.vouch_channel_id ? `<#${g.vouch_channel_id}>` : "—", inline: true }, { name: "Pay-Empfänger", value: `\`${shopPayRecipient(g.default_pay_recipient)}\``, inline: true }),
            ],
            flags: 64,
        });
        return;
    }
    const name = interaction.options.getString("name");
    const category = interaction.options.getChannel("ticket_kategorie");
    const role = interaction.options.getRole("team_rolle");
    const spawnerRole = interaction.options.getRole("spawner_rolle");
    const log = interaction.options.getChannel("log_kanal");
    const vouchCh = interaction.options.getChannel("vouch_kanal");
    const pay = interaction.options.getString("pay_empfaenger");
    const footerText = interaction.options.getString("footer");
    updateGuild(interaction.guildId, {
        ...(name ? { community_name: name } : {}),
        ...(category ? { ticket_category_id: category.id } : {}),
        ...(role ? { staff_role_id: role.id } : {}),
        ...(spawnerRole ? { spawner_staff_role_id: spawnerRole.id } : {}),
        ...(log ? { log_channel_id: log.id } : {}),
        ...(vouchCh ? { vouch_channel_id: vouchCh.id } : {}),
        ...(pay ? { default_pay_recipient: pay } : {}),
        ...(footerText ? { footer: footerText } : {}),
    });
    await interaction.reply({
        embeds: [warningEmbed("Setup gespeichert. Ticket-Panels und Buy-Panels nutzen ab jetzt diese Werte.", COLORS.green)],
        flags: 64,
    });
}
const msgDrafts = new Map();
function composeModal(opts) {
    const titleInput = new TextInputBuilder()
        .setCustomId("title")
        .setLabel("Titel (leer = normaler Text, ausgefüllt = Embed)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(256)
        .setPlaceholder("z. B. Ankündigung");
    if (opts.defaultTitle?.trim())
        titleInput.setValue(opts.defaultTitle.trim().slice(0, 256));
    return new ModalBuilder()
        .setCustomId("msg:compose")
        .setTitle(opts.title.slice(0, 45))
        .addComponents(new ActionRowBuilder().addComponents(titleInput), new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId("text")
        .setLabel("Nachricht  ·  **fett**  *kursiv*  Enter = neue Zeile")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(Math.min(opts.maxLength, 4000))
        .setPlaceholder("**Willkommen**\nShop ist *online*.\nDanach unten auf Senden.")));
}
function slashChannelId(interaction) {
    return interaction.options.getChannel("kanal")?.id ?? interaction.channelId;
}
function draftKey(userId, guildId) {
    return `${guildId ?? "dm"}:${userId}`;
}
function saveMsgDraft(userId, guildId, draft) {
    msgDrafts.set(draftKey(userId, guildId), draft);
}
async function cmdSay(interaction) {
    const channelId = slashChannelId(interaction);
    if (!channelId)
        throw new Error("Kein Zielkanal. `/sagen` in einem Textkanal nutzen oder `kanal:` setzen.");
    const asEmbed = interaction.options.getBoolean("embed") ?? false;
    saveMsgDraft(interaction.user.id, interaction.guildId, {
        command: "sagen",
        targetUserId: null,
        channelId,
        embed: asEmbed,
        title: interaction.options.getString("titel"),
        color: parseColor(interaction.options.getString("farbe")),
        image: null,
        footer: null,
    });
    await interaction.showModal(composeModal({
        title: "Nachricht senden",
        maxLength: asEmbed ? 4000 : 2000,
        defaultTitle: interaction.options.getString("titel"),
    }));
}
async function cmdMsg(interaction) {
    const user = interaction.options.getUser("user");
    const kanal = interaction.options.getChannel("kanal");
    const asEmbed = interaction.options.getBoolean("embed") ?? false;
    const channelId = kanal?.id ?? (user ? null : interaction.channelId);
    if (!channelId && !user) {
        throw new Error("Kein Zielkanal. `/msg` in einem Textkanal nutzen oder `kanal:` setzen.");
    }
    saveMsgDraft(interaction.user.id, interaction.guildId, {
        command: "msg",
        targetUserId: user?.id ?? null,
        channelId,
        embed: asEmbed,
        title: null,
        color: parseColor(interaction.options.getString("farbe")),
        image: null,
        footer: null,
    });
    await interaction.showModal(composeModal({
        title: user ? `Nachricht an ${user.username}` : "Nachricht senden",
        maxLength: asEmbed ? 4000 : 2000,
    }));
}
async function cmdEmbed(interaction) {
    const channelId = slashChannelId(interaction);
    if (!channelId)
        throw new Error("Kein Zielkanal. `/embed` in einem Textkanal nutzen oder `kanal:` setzen.");
    saveMsgDraft(interaction.user.id, interaction.guildId, {
        command: "embed",
        targetUserId: null,
        channelId,
        embed: true,
        title: interaction.options.getString("titel"),
        color: parseColor(interaction.options.getString("farbe")),
        image: interaction.options.getString("bild"),
        footer: interaction.options.getString("footer"),
    });
    await interaction.showModal(composeModal({
        title: "Embed senden",
        maxLength: 4000,
        defaultTitle: interaction.options.getString("titel"),
    }));
}
async function submitMsgCompose(interaction) {
    const key = draftKey(interaction.user.id, interaction.guildId);
    const draft = msgDrafts.get(key);
    msgDrafts.delete(key);
    if (!draft)
        throw new Error("Fenster abgelaufen. Bitte `/msg` nochmal ausführen.");
    const text = formatUserText(interaction.fields.getTextInputValue("text"));
    if (!text.trim())
        throw new Error("Nachricht ist leer.");
    const fromModal = interaction.fields.getTextInputValue("title")?.trim();
    const title = fromModal || draft.title;
    const asEmbed = draft.embed || Boolean(title);
    const payload = asEmbed
        ? {
            embeds: [
                customEmbed({
                    title,
                    description: text,
                    color: draft.color,
                    image: draft.image,
                    footer: draft.footer,
                }),
            ],
        }
        : { content: text };
    const sent = [];
    if (draft.targetUserId) {
        const user = await interaction.client.users.fetch(draft.targetUserId);
        try {
            await user.send(payload);
            sent.push(`DM an ${user}`);
        }
        catch {
            throw new Error(`${user} hat DMs deaktiviert. Die Nachricht wurde nicht zugestellt.`);
        }
    }
    if (draft.channelId) {
        const channel = await interaction.client.channels.fetch(draft.channelId).catch(() => null);
        if (!channel || !channel.isTextBased() || !("send" in channel) || channel.isDMBased()) {
            throw new Error("Zielkanal nicht gefunden oder kein Textkanal.");
        }
        await channel.send(payload);
        sent.push(`${channel}`);
    }
    if (!sent.length) {
        throw new Error("Kein Ziel. `/msg` in einem Textkanal nutzen.");
    }
    await interaction.reply({
        content: `Gesendet in ${sent.join(" · ")}.\nFormat: \`**fett**\` \`*kursiv*\` \`__unter__\` \`~~durch~~\` \`||spoiler||\` · Enter = neue Zeile`,
        flags: 64,
    });
}
async function cmdTicketCategory(interaction) {
    const sub = interaction.options.getSubcommand();
    ensureDefaultCategories(interaction.guildId);
    if (sub === "hinzufuegen") {
        const result = db
            .prepare("INSERT INTO ticket_categories (guild_id, name, emoji, description, type, sort_order) VALUES (?, ?, ?, ?, 'support', 99)")
            .run(interaction.guildId, interaction.options.getString("name", true), interaction.options.getString("emoji", true), interaction.options.getString("beschreibung", true));
        await interaction.reply({
            content: `Kategorie **#${result.lastInsertRowid}** gespeichert. Sende das Panel neu mit \`/ticket-panel\`.`,
            flags: 64,
        });
        return;
    }
    if (sub === "entfernen") {
        const id = interaction.options.getInteger("id", true);
        db.prepare("DELETE FROM ticket_categories WHERE id = ? AND guild_id = ?").run(id, interaction.guildId);
        await interaction.reply({ content: `Kategorie ${id} entfernt.`, flags: 64 });
        return;
    }
    const rows = db
        .prepare("SELECT * FROM ticket_categories WHERE guild_id = ? ORDER BY sort_order, id")
        .all(interaction.guildId);
    const body = rows.map((r) => `\`${r.id}\` ${r.emoji} **${r.name}** — ${r.description}`).join("\n") || "_Keine Kategorien._";
    await interaction.reply({
        embeds: [new EmbedBuilder().setColor(COLORS.green).setTitle("Ticket-Kategorien").setDescription(body)],
        flags: 64,
    });
}
async function cmdTicketPanel(interaction) {
    ensureDefaultCategories(interaction.guildId);
    const config = getGuild(interaction.guildId);
    const categories = db
        .prepare("SELECT * FROM ticket_categories WHERE guild_id = ? AND enabled = 1 AND type != 'verify' ORDER BY sort_order, id")
        .all(interaction.guildId);
    if (!categories.length)
        throw new Error("Lege zuerst Kategorien mit `/ticket-kategorie hinzufuegen` an.");
    const channel = await resolveTextChannel(interaction);
    const msg = await channel.send({
        embeds: [ticketPanelEmbed(config, categories)],
        components: [ticketSelect("main", categories)],
    });
    db.prepare("INSERT INTO panels (guild_id, type, channel_id, message_id) VALUES (?, 'ticket', ?, ?)").run(interaction.guildId, channel.id, msg.id);
    await interaction.reply({ content: `Ticket-Panel in ${channel} gesendet.`, flags: 64 });
}
async function cmdProduct(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "erstellen") {
        const seller = interaction.options.getUser("verkaeufer", true);
        const result = db
            .prepare(`INSERT INTO products (
          guild_id, name, description, greeting, warning, price, seller_id, pay_recipient,
          image_url, unlimited, status, sku, button_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)`)
            .run(interaction.guildId, interaction.options.getString("name", true), formatUserText(interaction.options.getString("beschreibung") ?? "Zum Verkauf steht dieses Angebot:"), interaction.options.getString("begruessung")
            ? formatUserText(interaction.options.getString("begruessung"))
            : null, interaction.options.getString("warnung")
            ? formatUserText(interaction.options.getString("warnung"))
            : null, interaction.options.getInteger("preis", true), seller.id, interaction.options.getString("empfaenger", true), interaction.options.getString("bild"), interaction.options.getBoolean("unlimitiert") === false ? 0 : 1, interaction.options.getString("sku"), interaction.options.getString("button") ?? "Kaufen");
        await interaction.reply({
            content: `Produkt **#${result.lastInsertRowid}** gespeichert. Sende es mit \`/buy-panel produkt_id:${result.lastInsertRowid}\`.`,
            flags: 64,
        });
        return;
    }
    if (sub === "anzeigen") {
        const product = db
            .prepare("SELECT * FROM products WHERE id = ? AND guild_id = ?")
            .get(interaction.options.getInteger("id", true), interaction.guildId);
        if (!product)
            throw new Error("Produkt nicht gefunden. `/produkt liste` zeigt alle IDs.");
        const config = getGuild(interaction.guildId);
        await interaction.reply({
            embeds: [productListingEmbed(config, product), productBuyEmbed(config, product)],
            components: [buyButton(product.id, product.button_label)],
            flags: 64,
        });
        return;
    }
    if (sub === "entfernen") {
        const id = interaction.options.getInteger("id", true);
        db.prepare("DELETE FROM products WHERE id = ? AND guild_id = ?").run(id, interaction.guildId);
        await interaction.reply({ content: `Produkt ${id} entfernt.`, flags: 64 });
        return;
    }
    const rows = db.prepare("SELECT id, name, price, pay_recipient FROM products WHERE guild_id = ?").all(interaction.guildId);
    const body = rows.map((r) => `\`${r.id}\` **${r.name}** — ${formatMoney(r.price)} · /pay \`${r.pay_recipient}\``).join("\n") ||
        "_Keine Produkte. Nutze `/produkt erstellen`._";
    await interaction.reply({
        embeds: [new EmbedBuilder().setColor(COLORS.green).setTitle("Produkte").setDescription(body)],
        flags: 64,
    });
}
async function cmdBuyPanel(interaction) {
    const id = interaction.options.getInteger("produkt_id", true);
    const product = db.prepare("SELECT * FROM products WHERE id = ? AND guild_id = ?").get(id, interaction.guildId);
    if (!product)
        throw new Error("Produkt nicht gefunden. `/produkt liste` zeigt alle IDs.");
    const config = getGuild(interaction.guildId);
    const channel = await resolveTextChannel(interaction);
    const listing = interaction.options.getBoolean("listing") ?? true;
    if (listing) {
        await channel.send({ embeds: [productListingEmbed(config, product)] });
    }
    const msg = await channel.send({
        embeds: [productBuyEmbed(config, product)],
        components: [buyButton(product.id, product.button_label)],
    });
    db.prepare("INSERT INTO panels (guild_id, type, channel_id, message_id, extra) VALUES (?, 'buy', ?, ?, ?)").run(interaction.guildId, channel.id, msg.id, String(product.id));
    await interaction.reply({ content: `Buy-Panel für **${product.name}** in ${channel} gesendet.`, flags: 64 });
}
async function cmdService(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "hinzufuegen") {
        const result = db
            .prepare("INSERT INTO services (guild_id, name, emoji, description, important, enabled, max_open) VALUES (?, ?, ?, ?, ?, 1, ?)")
            .run(interaction.guildId, interaction.options.getString("name", true), interaction.options.getString("emoji", true), formatUserText(interaction.options.getString("beschreibung", true)), interaction.options.getString("wichtig")
            ? formatUserText(interaction.options.getString("wichtig"))
            : null, interaction.options.getInteger("limit") ?? 10);
        await interaction.reply({
            content: `Service **#${result.lastInsertRowid}** gespeichert. Panel mit \`/service-panel\` senden.`,
            flags: 64,
        });
        return;
    }
    if (sub === "status") {
        const id = interaction.options.getInteger("id", true);
        const aktiv = interaction.options.getBoolean("aktiv", true);
        db.prepare("UPDATE services SET enabled = ? WHERE id = ? AND guild_id = ?").run(aktiv ? 1 : 0, id, interaction.guildId);
        await refreshServicePanels(interaction.client, requireGuildId(interaction.guildId));
        await interaction.reply({ content: `Service ${id} ist jetzt ${aktiv ? "aktiv" : "deaktiviert"}. Panel aktualisiert.`, flags: 64 });
        return;
    }
    const rows = db.prepare("SELECT * FROM services WHERE guild_id = ?").all(interaction.guildId);
    const body = rows.map((s) => `\`${s.id}\` ${s.emoji} **${s.name}** — ${s.enabled ? "aktiv" : "aus"} · Limit ${s.max_open}`).join("\n") ||
        "_Keine Services._";
    await interaction.reply({
        embeds: [new EmbedBuilder().setColor(COLORS.green).setTitle("Services").setDescription(body)],
        flags: 64,
    });
}
function loadServices(guildId) {
    const id = requireGuildId(guildId);
    const rows = db.prepare("SELECT * FROM services WHERE guild_id = ?").all(id);
    return rows.map((s) => ({ ...s, open: countOpenByService(id, s.id) }));
}
export async function refreshAllServicePanels(client) {
    const guilds = db
        .prepare("SELECT DISTINCT guild_id FROM panels WHERE type = 'service'")
        .all();
    for (const row of guilds) {
        await refreshServicePanels(client, row.guild_id);
    }
}
async function refreshServicePanels(client, guildId) {
    const rows = db
        .prepare("SELECT channel_id, message_id FROM panels WHERE guild_id = ? AND type = 'service'")
        .all(guildId);
    if (!rows.length)
        return;
    const services = loadServices(guildId);
    const config = getGuild(guildId);
    const payload = {
        embeds: [servicePanelEmbed(config, services)],
        components: services.length ? [serviceSelect(services)] : [],
    };
    for (const row of rows) {
        const ch = await client.channels.fetch(row.channel_id).catch(() => null);
        if (!ch || !ch.isTextBased() || !("messages" in ch))
            continue;
        const msg = await ch.messages.fetch(row.message_id).catch(() => null);
        await msg?.edit(payload).catch(() => undefined);
    }
}
async function cmdServicePanel(interaction) {
    const services = loadServices(interaction.guildId);
    if (!services.length)
        throw new Error("Lege zuerst Services mit `/service hinzufuegen` an.");
    const config = getGuild(interaction.guildId);
    const channel = await resolveTextChannel(interaction);
    const msg = await channel.send({
        embeds: [servicePanelEmbed(config, services)],
        components: [serviceSelect(services)],
    });
    db.prepare("INSERT INTO panels (guild_id, type, channel_id, message_id) VALUES (?, 'service', ?, ?)").run(interaction.guildId, channel.id, msg.id);
    await interaction.reply({ content: `Service-Panel in ${channel} gesendet.`, flags: 64 });
}
async function cmdGiveaway(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "starten") {
        const duration = parseDuration(interaction.options.getString("dauer", true));
        if (!duration)
            throw new Error("Ungültige Dauer. Beispiele: `30m`, `7h`, `1d`.");
        const publicId = shortId();
        const endsAt = new Date(Date.now() + duration);
        const channel = await resolveTextChannel(interaction);
        const payload = {
            title: formatUserText(interaction.options.getString("titel", true)),
            description: interaction.options.getString("beschreibung")
                ? formatUserText(interaction.options.getString("beschreibung"))
                : null,
            prize: formatUserText(interaction.options.getString("gewinne", true)),
            endsAt,
            publicId,
        };
        const msg = await channel.send({
            embeds: [giveawayEmbed(payload)],
            components: [giveawayJoinButton(0)],
        });
        const result = db
            .prepare(`INSERT INTO giveaways (public_id, guild_id, channel_id, message_id, title, description, prize, winners_count, ends_at, hosted_by, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'running')`)
            .run(publicId, interaction.guildId, channel.id, msg.id, payload.title, payload.description, payload.prize, interaction.options.getInteger("gewinner", true), endsAt.getTime(), interaction.user.id);
        const id = Number(result.lastInsertRowid);
        await msg.edit({ components: [giveawayJoinButton(id)] });
        await interaction.reply({ content: `Giveaway \`${publicId}\` in ${channel} gestartet.`, flags: 64 });
        return;
    }
    const publicId = interaction.options.getString("id", true);
    if (sub === "beenden") {
        const n = await finishGiveaway(interaction.client, publicId, true);
        await interaction.reply({ content: n ? `Giveaway \`${publicId}\` ausgelost.` : "Keine Teilnehmer.", flags: 64 });
        return;
    }
    await rerollGiveaway(interaction.client, publicId);
    await interaction.reply({ content: `Reroll für \`${publicId}\` ausgeführt.`, flags: 64 });
}
async function cmdVouch(interaction) {
    const product = interaction.options.getString("produkt", true);
    const quantity = interaction.options.getInteger("menge", true);
    const price = interaction.options.getInteger("preis", true);
    const buyer = interaction.options.getUser("kaeufer", true);
    const seller = interaction.options.getUser("verkaeufer", true);
    const rating = interaction.options.getInteger("bewertung", true);
    const note = interaction.options.getString("notiz");
    const category = interaction.options.getString("kategorie") ?? "Shop";
    const result = db
        .prepare(`INSERT INTO vouches (guild_id, category, product, quantity, price, buyer_id, seller_id, rating, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(interaction.guildId, category, product, quantity, price, buyer.id, seller.id, rating, note, Date.now());
    const id = Number(result.lastInsertRowid);
    const total = db.prepare("SELECT COUNT(*) AS c FROM vouches WHERE guild_id = ?").get(interaction.guildId).c;
    const categoryCount = db.prepare("SELECT COUNT(*) AS c FROM vouches WHERE guild_id = ? AND category = ?").get(interaction.guildId, category).c;
    const config = getGuild(interaction.guildId);
    const channel = await resolveTextChannel(interaction);
    await channel.send({
        embeds: [
            vouchEmbed(config, {
                id,
                category,
                product,
                quantity,
                price,
                buyer_id: buyer.id,
                seller_id: seller.id,
                rating,
                note,
            }, { categoryCount, total }),
        ],
    });
    await keepVouchPanelAtBottom(interaction.client, interaction.guildId);
    await interaction.reply({ content: `Vouch #${id} in ${channel} gepostet.`, flags: 64 });
}
async function cmdVouchPanel(interaction) {
    const channel = await resolveTextChannel(interaction);
    await placeVouchPanel(interaction.client, interaction.guildId, channel);
    await interaction.reply({
        content: `Vouch-Panel in ${channel}: altes Panel gelöscht, dieses bleibt immer die letzte Nachricht im Kanal.`,
        flags: 64,
    });
}
async function cmdPay(interaction) {
    const recipient = interaction.options.getString("empfaenger", true);
    const amount = interaction.options.getInteger("betrag", true);
    const qty = interaction.options.getInteger("menge") ?? 1;
    const product = interaction.options.getString("produkt") ?? "Zahlung";
    const total = amount * qty;
    const config = getGuild(interaction.guildId);
    const sellerId = interaction.user.id;
    await interaction.reply({
        embeds: [
            paymentEmbed({
                config,
                productName: product,
                quantity: qty,
                unitPrice: amount,
                total,
                sellerId,
                payRecipient: recipient,
                buyerId: interaction.user.id,
            }),
        ],
    });
}
async function cmdTicket(interaction) {
    const sub = interaction.options.getSubcommand();
    const ticket = getTicketByChannel(interaction.channelId);
    if (!ticket || ticket.status !== "open")
        throw new Error("Dieser Befehl geht nur in einem offenen Ticket.");
    const config = getGuild(interaction.guildId);
    const member = interaction.member;
    if (!member || typeof member === "string")
        throw new Error("Mitglied nicht gefunden.");
    if (sub === "preis") {
        if (!isStaff(member, config, ticket.type))
            throw new Error("Nur das Team kann einen Preis setzen.");
        const amount = parsePrice(interaction.options.getString("betrag", true));
        if (amount == null || amount <= 0)
            throw new Error("Bitte einen gültigen Betrag angeben (kein STOP).");
        const qty = interaction.options.getInteger("menge") ?? ticket.quantity ?? 1;
        const product = interaction.options.getString("produkt") ?? ticket.product_name ?? "Ticket";
        await applyTicketPrice(interaction, ticket.id, amount, product, qty);
        return;
    }
    if (sub === "schliessen") {
        if (ticket.user_id !== interaction.user.id && !isStaff(member, config, ticket.type)) {
            throw new Error("Nur das Team oder der Ticket-Ersteller kann schließen.");
        }
        await closeTicket(interaction, ticket.id);
        return;
    }
    if (!isStaff(member, config, ticket.type))
        throw new Error("Nur das Team kann User hinzufügen.");
    const user = interaction.options.getUser("user", true);
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.isDMBased())
        throw new Error("Kein Ticket-Kanal.");
    if ("permissionOverwrites" in channel) {
        await channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    }
    await interaction.reply({ content: `${user} wurde zum Ticket hinzugefügt.` });
}
export async function handleButton(interaction) {
    try {
        if (interaction.customId.startsWith("vouchdm:")) {
            await handleVouchDmButton(interaction);
            return;
        }
        if (!interaction.inGuild())
            return;
        const [kind, action, rawId] = interaction.customId.split(":");
        if (kind === "buy" && action) {
            await openBuyModal(interaction, Number(action));
            return;
        }
        if (kind === "spawner" && (action === "sell" || action === "buy")) {
            await openSpawnerPicker(interaction, action);
            return;
        }
        if (kind === "gw" && action === "join") {
            await joinGiveaway(interaction, Number(rawId));
            return;
        }
        if (kind === "service" && (action === "confirm" || action === "cancel") && rawId) {
            await handleServiceDecision(interaction, action, Number(rawId));
            return;
        }
        if (kind === "ticket" && action === "close") {
            await closeTicket(interaction, Number(rawId));
            return;
        }
        if (kind === "ticket" && action === "claim") {
            await claimTicket(interaction, Number(rawId));
            return;
        }
        if (kind === "ticket" && action === "pay") {
            await repostPay(interaction, Number(rawId));
            return;
        }
        if (kind === "ticket" && action === "setprice") {
            await openSetPriceModal(interaction, Number(rawId));
            return;
        }
        if (kind === "clan" && action === "apply") {
            await openClanApplyModal(interaction, rawId ? Number(rawId) : undefined);
            return;
        }
        if (kind === "clan" && (action === "accept" || action === "reject" || action === "kick") && rawId) {
            await handleClanDecision(interaction, action, rawId);
            return;
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Fehler.";
        await replyError(interaction, message);
    }
}
export async function handleSelect(interaction) {
    if (!interaction.inGuild())
        return;
    try {
        if (interaction.customId.startsWith("ticket:select")) {
            await openSupportTicket(interaction, Number(interaction.values[0]));
            return;
        }
        if (interaction.customId.startsWith("spawner:pick:")) {
            await openSpawnerQtyModal(interaction);
            return;
        }
        if (interaction.customId === "clan:pick") {
            await openClanApplyModal(interaction, Number(interaction.values[0]));
            return;
        }
        if (interaction.customId === "service:select") {
            await openServiceTicket(interaction, Number(interaction.values[0]));
            return;
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Fehler.";
        await replyError(interaction, message);
    }
}
export async function handleUserSelect(interaction) {
    if (!interaction.inGuild())
        return;
    try {
        const user = interaction.users.first();
        if (!user)
            throw new Error("Keine Person ausgewählt.");
        const config = getGuild(interaction.guildId);
        const asBuyer = db
            .prepare("SELECT * FROM vouches WHERE guild_id = ? AND buyer_id = ? ORDER BY id DESC LIMIT 8")
            .all(interaction.guildId, user.id);
        const asSeller = db
            .prepare("SELECT * FROM vouches WHERE guild_id = ? AND seller_id = ? ORDER BY id DESC LIMIT 8")
            .all(interaction.guildId, user.id);
        const avg = (rows) => rows.length ? (rows.reduce((a, r) => a + r.rating, 0) / rows.length).toFixed(2) : "—";
        const list = (rows) => rows.map((r) => `#${r.id} ${stars(r.rating).slice(0, 5)} **${r.product}** · ${formatMoney(r.price)}`).join("\n") || "_Keine Einträge._";
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(COLORS.yellow)
                    .setTitle(`Vouch-Statistik · ${user.displayName}`)
                    .setDescription(`${user}`)
                    .addFields({ name: "Als Käufer", value: `${asBuyer.length} Vouches · Ø ${avg(asBuyer)}\n${list(asBuyer)}`.slice(0, 1024) }, { name: "Als Verkäufer", value: `${asSeller.length} Vouches · Ø ${avg(asSeller)}\n${list(asSeller)}`.slice(0, 1024) })
                    .setFooter({ text: footer(config, "Vouch-Auswertung") }),
            ],
            flags: 64,
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Fehler.";
        await replyError(interaction, message);
    }
}
export async function handleModal(interaction) {
    if (!interaction.inGuild())
        return;
    try {
        if (interaction.customId.startsWith("buy:qty:")) {
            const productId = Number(interaction.customId.split(":")[2]);
            const qty = Number(interaction.fields.getTextInputValue("qty"));
            if (!Number.isInteger(qty) || qty < 1 || qty > 99)
                throw new Error("Bitte eine Menge zwischen 1 und 99 eingeben.");
            await openBuyTicket(interaction, productId, qty);
            return;
        }
        if (interaction.customId.startsWith("spawner:qty:")) {
            const parts = interaction.customId.split(":");
            const direction = parts[2] === "buy" ? "buy" : "sell";
            const spawnerId = Number(parts[3]);
            await openSpawnerTicket(interaction, direction, spawnerId);
            return;
        }
        if (interaction.customId === "msg:compose") {
            await submitMsgCompose(interaction);
            return;
        }
        if (interaction.customId.startsWith("clan:apply")) {
            await submitClanApplication(interaction);
            return;
        }
        if (interaction.customId.startsWith("clan:info")) {
            await submitClanInfo(interaction);
            return;
        }
        if (interaction.customId.startsWith("ticket:setprice:")) {
            const ticketId = Number(interaction.customId.split(":")[2]);
            const amount = parsePrice(interaction.fields.getTextInputValue("betrag"));
            if (amount == null || amount <= 0)
                throw new Error("Bitte einen gültigen Betrag angeben (kein STOP).");
            const product = interaction.fields.getTextInputValue("produkt").trim() || "Ticket";
            await applyTicketPrice(interaction, ticketId, amount, product, 1);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Fehler.";
        await replyError(interaction, message);
    }
}
async function openBuyModal(interaction, productId) {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
    if (!product)
        throw new Error("Produkt nicht mehr verfügbar.");
    if (product.status !== "available")
        throw new Error("Dieses Angebot ist derzeit nicht verfügbar.");
    const modal = new ModalBuilder().setCustomId(`buy:qty:${productId}`).setTitle(`Kaufen · ${product.name.slice(0, 30)}`);
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId("qty")
        .setLabel("Menge")
        .setStyle(TextInputStyle.Short)
        .setValue("1")
        .setRequired(true)
        .setMaxLength(2)));
    await interaction.showModal(modal);
}
async function openBuyTicket(interaction, productId, quantity) {
    const guildId = requireGuildId(interaction.guildId);
    const product = db.prepare("SELECT * FROM products WHERE id = ? AND guild_id = ?").get(productId, guildId);
    if (!product || product.status !== "available")
        throw new Error("Produkt nicht verfügbar.");
    const config = getGuild(guildId);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const total = product.price * quantity;
    const channel = await createTicketChannel({
        guild: interaction.guild,
        config,
        member,
        prefix: "kauf",
        topic: `Kauf ${product.name} × ${quantity} · ${interaction.user.tag}`,
    });
    const ticketId = insertTicket({
        guild_id: guildId,
        channel_id: channel.id,
        user_id: interaction.user.id,
        type: "buy",
        product_id: product.id,
        quantity,
        unit_price: product.price,
        total,
        pay_recipient: product.pay_recipient,
        seller_id: product.seller_id,
        product_name: product.name,
    });
    await channel.send({
        content: `${member} · <@${product.seller_id}>${staffMention(config)}`,
        embeds: [
            paymentEmbed({
                config,
                productName: product.name,
                quantity,
                unitPrice: product.price,
                total,
                sellerId: product.seller_id,
                payRecipient: product.pay_recipient,
                buyerId: interaction.user.id,
                sku: product.sku,
            }),
        ],
        components: [ticketControls(ticketId, { hasPay: true })],
    });
    await interaction.reply({
        content: `Dein Kauf-Ticket wurde geöffnet: ${channel}\nGesamt: **${formatMoney(total)}**`,
        flags: 64,
    });
}
async function openSupportTicket(interaction, categoryId) {
    const guildId = requireGuildId(interaction.guildId);
    const category = db.prepare("SELECT * FROM ticket_categories WHERE id = ? AND guild_id = ?").get(categoryId, guildId);
    if (!category)
        throw new Error("Kategorie nicht gefunden.");
    const config = getGuild(guildId);
    assertCanOpenSupportTicket(guildId, interaction.user.id, config);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const channel = await createTicketChannel({
        guild: interaction.guild,
        config,
        member,
        prefix: "ticket",
        topic: `${category.name} · ${interaction.user.tag}`,
    });
    const ticketId = insertTicket({
        guild_id: guildId,
        channel_id: channel.id,
        user_id: interaction.user.id,
        type: "support",
        category_id: category.id,
    });
    await channel.send({
        content: `${member}${staffMention(config)}`,
        embeds: [
            new EmbedBuilder()
                .setColor(COLORS.green)
                .setTitle(`${category.emoji} ${category.name}`)
                .setDescription(`Hallo ${member}, beschreibe bitte dein Anliegen.\nDas Team wird sich so schnell wie möglich bei dir melden.\n\n${category.description}\n\nNoch kein Preis hinterlegt — ein Teammitglied setzt ihn bei Bedarf mit **Preis festlegen** oder \`/ticket preis\`. Danach erscheint \`/pay y3zz\`.`)
                .setFooter({ text: footer(config, "Ticket-System") }),
        ],
        components: [ticketControls(ticketId, { hasPay: false })],
    });
    await interaction.reply({ content: `Ticket geöffnet: ${channel}`, flags: 64 });
    await interaction.message.edit({ components: interaction.message.components }).catch(() => undefined);
}
async function openServiceTicket(interaction, serviceId) {
    const guildId = requireGuildId(interaction.guildId);
    const service = db.prepare("SELECT * FROM services WHERE id = ? AND guild_id = ?").get(serviceId, guildId);
    if (!service)
        throw new Error("Service nicht gefunden.");
    assertServiceCapacity(guildId, service);
    const config = getGuild(guildId);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const channel = await createTicketChannel({
        guild: interaction.guild,
        config,
        member,
        prefix: "service",
        topic: `${service.name} · ${interaction.user.tag}`,
    });
    const ticketId = insertTicket({
        guild_id: guildId,
        channel_id: channel.id,
        user_id: interaction.user.id,
        type: "service",
        service_id: service.id,
    });
    await channel.send({
        content: `${member}${staffMention(config)}`,
        embeds: [
            new EmbedBuilder()
                .setColor(COLORS.green)
                .setTitle(`${service.emoji} ${service.name}`)
                .setDescription(`Hallo ${member},\n${service.description}\n\nBitte beschreibe, was gebaut oder erledigt werden soll.\n\nKein Preis hinterlegt — das Team setzt ihn mit **Preis festlegen**.`)
                .setFooter({ text: footer(config, "Service-System") }),
        ],
        components: [serviceTicketControls(ticketId)],
    });
    await interaction.reply({ content: `Service-Ticket geöffnet: ${channel}`, flags: 64 });
    await refreshServicePanels(interaction.client, guildId);
}
async function openSetPriceModal(interaction, ticketId) {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
    if (!ticket || ticket.status !== "open")
        throw new Error("Ticket ist geschlossen.");
    const config = getGuild(interaction.guildId);
    if (!isStaff(interaction.member, config, ticket.type))
        throw new Error("Nur das Team kann einen Preis setzen.");
    const modal = new ModalBuilder().setCustomId(`ticket:setprice:${ticketId}`).setTitle("Preis festlegen");
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId("betrag")
        .setLabel("Betrag (z. B. 5,0M oder 2500000)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(20)), new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId("produkt")
        .setLabel("Bezeichnung (optional)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(80)
        .setPlaceholder("z. B. Support, Map, Extra")));
    await interaction.showModal(modal);
}
async function applyTicketPrice(interaction, ticketId, amount, productName, quantity) {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
    if (!ticket || ticket.status !== "open")
        throw new Error("Ticket ist geschlossen.");
    const config = getGuild(ticket.guild_id);
    const payTo = shopPayRecipient(config.default_pay_recipient);
    const total = amount * quantity;
    db.prepare(`UPDATE tickets SET unit_price = ?, quantity = ?, total = ?, pay_recipient = ?, product_name = ?,
     seller_id = COALESCE(seller_id, ?) WHERE id = ?`).run(amount, quantity, total, payTo, productName, interaction.user.id, ticketId);
    const embed = paymentEmbed({
        config,
        productName,
        quantity,
        unitPrice: amount,
        total,
        sellerId: ticket.seller_id ?? interaction.user.id,
        payRecipient: payTo,
        buyerId: ticket.user_id,
        sku: "Ticket",
    });
    if (interaction.isModalSubmit() && interaction.isFromMessage()) {
        await interaction.update({
            components: [ticketControls(ticketId, { hasPay: true })],
        });
        await interaction.followUp({ embeds: [embed] });
        return;
    }
    await interaction.reply({ embeds: [embed] });
}
async function handleServiceDecision(interaction, action, ticketId) {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
    if (!ticket || ticket.status !== "open")
        throw new Error("Ticket ist bereits geschlossen.");
    const config = getGuild(ticket.guild_id);
    if (ticket.user_id !== interaction.user.id && !isStaff(interaction.member, config, ticket.type)) {
        throw new Error("Nur das Team oder der Ticket-Ersteller kann bestätigen oder abbrechen.");
    }
    if (action === "confirm") {
        db.prepare("UPDATE tickets SET status = 'closed' WHERE id = ?").run(ticketId);
        const asked = await sendVouchDm(interaction.client, ticket);
        const extra = asked === "sent" ? " Bewertung per DM gesendet."
            : asked === "failed" ? " DM nicht möglich." : "";
        await interaction.reply({
            embeds: [warningEmbed(`✅ Service-Ticket bestätigt und abgeschlossen.${extra}`, COLORS.green)],
        });
        setTimeout(() => {
            interaction.channel?.delete("Service bestätigt").catch(() => undefined);
        }, 5000);
    }
    else {
        db.prepare("UPDATE tickets SET status = 'closed' WHERE id = ?").run(ticketId);
        await interaction.reply({
            embeds: [warningEmbed("❌ Service-Ticket abgebrochen. Kanal wird in 5 Sekunden gelöscht.", COLORS.red)],
        });
        setTimeout(() => {
            interaction.channel?.delete("Service abgebrochen").catch(() => undefined);
        }, 5000);
    }
    await refreshServicePanels(interaction.client, ticket.guild_id);
}
async function closeTicket(interaction, ticketId) {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
    if (!ticket || ticket.status !== "open")
        throw new Error("Ticket ist bereits geschlossen.");
    const config = getGuild(ticket.guild_id);
    const member = interaction.member;
    if (ticket.user_id !== interaction.user.id && !isStaff(member && typeof member !== "string" ? member : null, config, ticket.type)) {
        throw new Error("Nur das Team oder der Ticket-Ersteller kann schließen.");
    }
    db.prepare("UPDATE tickets SET status = 'closed' WHERE id = ?").run(ticketId);
    const asked = await sendVouchDm(interaction.client, ticket);
    const extra = asked === "sent"
        ? " Der Käufer erhält eine DM zur Bewertung (Sterne → Vouch)."
        : asked === "failed"
            ? " Bewertung per DM war nicht möglich (DMs geschlossen?)."
            : "";
    await interaction.reply({
        embeds: [warningEmbed(`Ticket wird in 5 Sekunden geschlossen.${extra}`, COLORS.yellow)],
    });
    if (ticket.type === "service") {
        await refreshServicePanels(interaction.client, ticket.guild_id);
    }
    setTimeout(() => {
        interaction.channel?.delete("Ticket geschlossen").catch(() => undefined);
    }, 5000);
}
async function claimTicket(interaction, ticketId) {
    const ticket = db.prepare("SELECT type FROM tickets WHERE id = ?").get(ticketId);
    const config = getGuild(interaction.guildId);
    if (!isStaff(interaction.member, config, ticket?.type))
        throw new Error("Nur das Team kann Tickets übernehmen.");
    db.prepare("UPDATE tickets SET claimed_by = ? WHERE id = ?").run(interaction.user.id, ticketId);
    await interaction.reply({ content: `${interaction.user} hat das Ticket übernommen.` });
}
async function repostPay(interaction, ticketId) {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
    if (!ticket || !ticket.total || !ticket.pay_recipient) {
        throw new Error("Für dieses Ticket gibt es keine Zahlung.");
    }
    const product = ticket.product_id
        ? db.prepare("SELECT name, sku FROM products WHERE id = ?").get(ticket.product_id)
        : { name: ticket.type.startsWith("spawner") ? "Spawner" : "Bestellung", sku: null };
    const config = getGuild(interaction.guildId);
    await interaction.reply({
        embeds: [
            paymentEmbed({
                config,
                productName: product.name,
                quantity: ticket.quantity,
                unitPrice: ticket.unit_price ?? ticket.total,
                total: ticket.total,
                sellerId: ticket.seller_id ?? interaction.user.id,
                payRecipient: ticket.pay_recipient,
                buyerId: ticket.user_id,
                sku: product.sku,
            }),
        ],
    });
}
async function joinGiveaway(interaction, id) {
    const gw = db.prepare("SELECT * FROM giveaways WHERE id = ?").get(id);
    if (!gw || gw.status !== "running")
        throw new Error("Dieses Gewinnspiel ist bereits beendet.");
    const info = db.prepare("INSERT OR IGNORE INTO giveaway_entries (giveaway_id, user_id) VALUES (?, ?)").run(id, interaction.user.id);
    if (!info.changes) {
        await interaction.reply({ content: "Du nimmst bereits teil.", flags: 64 });
        return;
    }
    const count = db.prepare("SELECT COUNT(*) AS c FROM giveaway_entries WHERE giveaway_id = ?").get(id).c;
    await interaction.reply({ content: `Du nimmst teil! Aktuell **${count}** Teilnehmer.`, flags: 64 });
}
function pickWinners(userIds, n) {
    const pool = [...userIds];
    const winners = [];
    while (pool.length && winners.length < n) {
        const i = Math.floor(Math.random() * pool.length);
        winners.push(pool.splice(i, 1)[0]);
    }
    return winners;
}
export async function finishGiveaway(client, publicId, force = false) {
    const gw = db.prepare("SELECT * FROM giveaways WHERE public_id = ?").get(publicId);
    if (!gw)
        throw new Error("Giveaway nicht gefunden.");
    if (gw.status !== "running" && !force)
        return 0;
    const entries = db.prepare("SELECT user_id FROM giveaway_entries WHERE giveaway_id = ?").all(gw.id);
    const winners = pickWinners(entries.map((e) => e.user_id), gw.winners_count);
    db.prepare("UPDATE giveaways SET status = 'ended' WHERE id = ?").run(gw.id);
    const channel = await client.channels.fetch(gw.channel_id).catch(() => null);
    if (channel && channel.isTextBased() && "send" in channel) {
        const lines = winners.length
            ? winners.map((id, i) => `${i + 1}. <@${id}> — **${gw.prize.replace(/^•\s*/, "")}**`)
            : ["Keine Teilnehmer."];
        await channel.send({ embeds: [winnersEmbed(gw.public_id, lines)] });
        if ("messages" in channel) {
            const msg = await channel.messages.fetch(gw.message_id).catch(() => null);
            await msg?.edit({ components: [] }).catch(() => undefined);
        }
    }
    return winners.length;
}
export async function rerollGiveaway(client, publicId) {
    const gw = db.prepare("SELECT * FROM giveaways WHERE public_id = ?").get(publicId);
    if (!gw)
        throw new Error("Giveaway nicht gefunden.");
    const entries = db.prepare("SELECT user_id FROM giveaway_entries WHERE giveaway_id = ?").all(gw.id);
    const winners = pickWinners(entries.map((e) => e.user_id), gw.winners_count);
    const channel = await client.channels.fetch(gw.channel_id).catch(() => null);
    if (channel && channel.isTextBased() && "send" in channel) {
        const lines = winners.length
            ? winners.map((id, i) => `${i + 1}. <@${id}> — **${gw.prize.replace(/^•\s*/, "")}**`)
            : ["Keine Teilnehmer."];
        await channel.send({ content: "Neues Reroll:", embeds: [winnersEmbed(gw.public_id, lines)] });
    }
}
export async function tickGiveaways(client) {
    const due = db
        .prepare("SELECT public_id FROM giveaways WHERE status = 'running' AND ends_at <= ?")
        .all(Date.now());
    for (const row of due) {
        await finishGiveaway(client, row.public_id).catch((err) => console.error("Giveaway end failed", err));
    }
}
export { payCommand, formatMoney };
