import { useMemo, useRef, useState } from "react";
import {
  Code,
  DiscordButton,
  DiscordMessage,
  Embed,
  Field,
  Mention,
  SelectBox,
} from "./components/ui";
import { formatMillions, formatMoney, parsePrice, payCommand, stars } from "./format";
import { DiscordMarkdown } from "./markdown";

type ChannelId = "ticket" | "map" | "vouch" | "fwm" | "giveaway" | "services" | "spawner" | "clan" | "commands" | `kauf-${string}`;

type Ticket = {
  id: string;
  kind: "support" | "buy" | "service";
  title: string;
  product?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  recipient?: string;
};

const TICKET_OPTIONS = [
  { value: "web", label: "🔵 Website-Support" },
  { value: "allgemein", label: "⚪ Allgemeiner Support" },
  { value: "fight", label: "⚔️ Clan-Fight" },
  { value: "allianz", label: "🤝 Allianz-Anfrage" },
  { value: "gw", label: "🎉 Giveaway" },
];

const TICKET_META: Record<string, { emoji: string; name: string; text: string }> = {
  web: { emoji: "🔵", name: "Website-Support", text: "Hilfe rund um Website, Login oder technische Probleme." },
  allgemein: { emoji: "⚪", name: "Allgemeiner Support", text: "allgemeine Fragen und Anliegen." },
  fight: { emoji: "⚔️", name: "Clan-Fight", text: "Anfrage für einen Clan-Fight." },
  allianz: { emoji: "🤝", name: "Allianz-Anfrage", text: "Anfrage für eine Allianz mit TXTClan." },
  gw: { emoji: "🎉", name: "Giveaway", text: "Anliegen rund um Gewinne oder Gewinnspiele." },
};

const VOUCH_PEOPLE = [
  { value: "hydra", label: "HydraVB | TXT", buyer: 12, seller: 3, avg: 5 },
  { value: "hugo", label: "Hugo", buyer: 4, seller: 40, avg: 4.9 },
  { value: "nether", label: "Netherite0815", buyer: 8, seller: 1, avg: 4.8 },
];

const PRODUCT = {
  name: "Thorfinn von Vinland Saga",
  price: 6_000_000,
  seller: "@MapSeller",
  recipient: "TXTClan",
  sku: "#7",
};

export default function App() {
  const [channel, setChannel] = useState<ChannelId>("map");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [gwJoined, setGwJoined] = useState(false);
  const [gwCount, setGwCount] = useState(42);
  const [vouchUser, setVouchUser] = useState<string | null>(null);
  const [sayText, setSayText] = useState("");
  const [sayColor, setSayColor] = useState("#ed4245");
  const [posted, setPosted] = useState<{ text: string; color: string; title?: string }[]>([]);
  const [serviceOpen, setServiceOpen] = useState(10);
  const [copied, setCopied] = useState(false);

  const channels: { id: ChannelId; name: string; unread?: boolean }[] = useMemo(() => {
    const extra = tickets.map((t) => ({
      id: `kauf-${t.id}` as ChannelId,
      name: t.kind === "buy" ? `🛒${t.title}` : t.kind === "service" ? `🧡${t.title}` : `🎫${t.title}`,
      unread: true as const,
    }));
    return [
      { id: "ticket", name: "🎫TICKET" },
      { id: "map", name: "🖼️MAP-ARTS" },
      { id: "vouch", name: "🤍VOUCH" },
      { id: "fwm", name: "🪖TXTCLAN" },
      { id: "giveaway", name: "💫GIVEAWAY" },
      { id: "services", name: "🧡SERVICES" },
      { id: "spawner", name: "🧱SPAWNER" },
      { id: "clan", name: "🤝CLAN" },
      { id: "commands", name: "⚙️BEFEHLE" },
      ...extra,
    ];
  }, [tickets]);

  const header = channels.find((c) => c.id === channel)?.name.replace(/^[^\w🎫🖼️🤍🪖💫🧡⚙️🛒🤝]+/, "") ?? channel;

  function openSupport(key: string) {
    const meta = TICKET_META[key];
    if (!meta) return;
    const id = `${Date.now()}`;
    const ticket: Ticket = { id, kind: "support", title: meta.name.toLowerCase().replace(/\s+/g, "-") };
    setTickets((t) => [...t, ticket]);
    setChannel(`kauf-${id}`);
    setSidebarOpen(false);
  }

  function openBuy() {
    const id = `${Date.now()}`;
    const ticket: Ticket = {
      id,
      kind: "buy",
      title: "map-art",
      product: PRODUCT.name,
      quantity: qty,
      unitPrice: PRODUCT.price,
      total: PRODUCT.price * qty,
      recipient: PRODUCT.recipient,
    };
    setTickets((t) => [...t, ticket]);
    setQtyOpen(false);
    setChannel(`kauf-${id}`);
    setSidebarOpen(false);
  }

  function openService(name: string) {
    if (serviceOpen >= 10 && name.includes("Base")) return;
    const id = `${Date.now()}`;
    const ticket: Ticket = { id, kind: "service", title: name.toLowerCase().replace(/\s+/g, "-") };
    setTickets((t) => [...t, ticket]);
    setServiceOpen((n) => Math.min(10, n + 1));
    setChannel(`kauf-${id}`);
    setSidebarOpen(false);
  }

  const activeTicket = channel.startsWith("kauf-")
    ? tickets.find((t) => `kauf-${t.id}` === channel)
    : undefined;

  async function copyPay(cmd: string) {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 bg-[#313338] text-[#dbdee1]">
      <aside className="hidden w-[72px] shrink-0 flex-col items-center gap-2 bg-[#1e1f22] py-3 md:flex">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[16px] bg-[#111]">
          <img src="/fwm-logo.svg" alt="TXTClan" className="h-12 w-12 overflow-hidden rounded-[16px] object-cover" />
        </div>
        <div className="h-[2px] w-8 rounded bg-[#3f4147]" />
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#313338] text-xl" title="TXTClan Bot">
          🎫
        </div>
      </aside>

      <aside
        className={`${
          sidebarOpen ? "flex" : "hidden"
        } absolute z-20 h-full w-[240px] flex-col bg-[#2b2d31] md:relative md:flex`}
      >
        <div className="flex h-12 items-center border-b border-black/20 px-4 shadow-sm">
          <div className="truncate text-[16px] font-semibold text-white">TXTClan</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#949ba4]">Shop & Support</p>
          {channels.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setChannel(c.id);
                setSidebarOpen(false);
              }}
              className={`mb-0.5 flex w-full items-center rounded-[4px] px-2 py-1.5 text-left text-[15px] ${
                channel === c.id ? "bg-[#404249] text-white" : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
              }`}
            >
              <span className="mr-1 text-[#80848e]">#</span>
              <span className="truncate">{c.name.replace(/^#/, "")}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-[#232428] p-2">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-[#111]">
            <img src="/fwm-logo.svg" alt="" className="h-full w-full rounded-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">TXTClan Bot</div>
            <div className="text-[11px] text-[#23a559]">Online</div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-2 border-b border-black/20 px-3 shadow-sm">
          <button
            type="button"
            className="rounded p-1 text-xl md:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Kanäle"
          >
            ☰
          </button>
          <span className="text-[#80848e]">#</span>
          <h1 className="truncate text-[16px] font-semibold text-white">{header}</h1>
          {channel === "map" || channel === "fwm" ? (
            <span className="ml-auto hidden text-xs text-[#949ba4] sm:inline">Kanal kann nur gelesen werden.</span>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {channel === "ticket" && <TicketChannel onSelect={openSupport} />}
          {channel === "map" && <MapChannel onBuy={() => setQtyOpen(true)} />}
          {channel === "vouch" && <VouchChannel selected={vouchUser} onSelect={setVouchUser} />}
          {channel === "fwm" && <WarningChannel extras={posted} />}
          {channel === "giveaway" && (
            <GiveawayChannel
              joined={gwJoined}
              count={gwCount}
              onJoin={() => {
                if (gwJoined) return;
                setGwJoined(true);
                setGwCount((n) => n + 1);
              }}
            />
          )}
          {channel === "services" && (
            <ServiceChannel open={serviceOpen} onSelect={openService} />
          )}
          {channel === "spawner" && <SpawnerChannel />}
          {channel === "clan" && <ClanChannel />}
          {channel === "commands" && (
            <CommandsChannel
              sayText={sayText}
              setSayText={setSayText}
              sayColor={sayColor}
              setSayColor={setSayColor}
              onSend={(title) => {
                if (!sayText.trim()) return;
                setPosted((p) => [...p, { text: sayText, color: sayColor, title }]);
                setSayText("");
                setChannel("fwm");
              }}
            />
          )}
          {activeTicket && (
            <TicketView ticket={activeTicket} copied={copied} onCopy={copyPay} />
          )}
        </div>
      </main>

      {qtyOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-lg bg-[#313338] p-4 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-white">Kaufen · {PRODUCT.name}</h2>
            <p className="mb-4 text-sm text-[#b5bac1]">Wie viele Stück? Der Gesamtpreis wird automatisch berechnet.</p>
            <label className="text-xs font-bold uppercase text-[#b5bac1]">Menge</label>
            <input
              type="number"
              min={1}
              max={99}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
              className="mt-1 mb-3 w-full rounded bg-[#1e1f22] px-3 py-2 text-white outline-none"
            />
            <p className="mb-4 text-sm">
              Gesamt: <strong className="text-white">{formatMoney(PRODUCT.price * qty)}</strong>
            </p>
            <div className="flex justify-end gap-2">
              <DiscordButton variant="secondary" onClick={() => setQtyOpen(false)}>
                Abbrechen
              </DiscordButton>
              <DiscordButton onClick={openBuy}>Ticket öffnen</DiscordButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketChannel({ onSelect }: { onSelect: (key: string) => void }) {
  return (
    <DiscordMessage>
      <Embed color="#23a559" footer="TXTClan · Ticket-System">
        <p>🔵 <strong>Website-Support</strong></p>
        <p className="mb-3">Hilfe rund um Website, Login oder technische Probleme.</p>
        <p>⚪ <strong>Allgemeiner Support</strong></p>
        <p className="mb-3">allgemeine Fragen und Anliegen.</p>
        <p>⚔️ <strong>Clan-Fight</strong></p>
        <p className="mb-3">Anfrage für einen Clan-Fight.</p>
        <p>🤝 <strong>Allianz-Anfrage</strong></p>
        <p className="mb-3">Anfrage für eine Allianz mit TXTClan.</p>
        <p>🎉 <strong>Giveaway</strong></p>
        <p className="mb-3">Anliegen rund um Gewinne oder Gewinnspiele.</p>
        <p>🔒 <strong>Wichtiger Hinweis</strong></p>
        <p>
          Pro Person ist <strong>ein aktives Support-Ticket</strong> erlaubt (außer Bewerbungen).
        </p>
      </Embed>
      <SelectBox placeholder="Wähle dein Anliegen aus ..." options={TICKET_OPTIONS} onChange={onSelect} />
    </DiscordMessage>
  );
}

function MapChannel({ onBuy }: { onBuy: () => void }) {
  return (
    <>
      <DiscordMessage>
        <Embed color="#23a559" footer="TXTClan · Map-Art-Verkauf">
          <p className="text-[16px] font-semibold text-white">🎨 {PRODUCT.name}</p>
          <p className="mt-2">
            Hallo, liebe <strong>HugoSMP-Community!</strong>
          </p>
          <p className="mt-2">Zum Verkauf steht eine <strong>2 x 2 Karten große Map-Art</strong> zum Thema:</p>
          <blockquote className="quote mt-2">
            <strong>{PRODUCT.name}</strong>
          </blockquote>
          <Field
            name="♾️ Nicht limitiert"
            value="Die Map-Art ist nicht limitiert und kann von beliebig vielen Spielern erworben werden."
          />
          <Field name="⚠️ WICHTIG" value={<strong>ES WIRD NICHT DIE ORIGINALKARTE VERKAUFT!</strong>} />
          <Field name="💸 VERKÄUFER" value={<>Die Map-Art wird verkauft von: <Mention>{PRODUCT.seller}</Mention></>} />
          <Field name="💰 Preis" value={<span className="text-[16px] font-bold text-white">{formatMoney(PRODUCT.price)}</span>} />
        </Embed>
      </DiscordMessage>
      <DiscordMessage>
        <Embed color="#23a559" footer="TXTClan · Map-Art-Verkauf | heute um 12:04 Uhr" image="/mapart.svg">
          <p>
            Die Map-Art wird verkauft von: <Mention>{PRODUCT.seller}</Mention>
          </p>
          <Field name="💰 Preis" value={<span className="text-[16px] font-bold text-white">{formatMoney(PRODUCT.price)}</span>} />
          <Field name="Status" value="✅ Verfügbar" />
          <Field name="Map-Art-ID" value={PRODUCT.sku} />
        </Embed>
        <DiscordButton onClick={onBuy}>🛒 Map-Art kaufen</DiscordButton>
      </DiscordMessage>
    </>
  );
}

function VouchChannel({ selected, onSelect }: { selected: string | null; onSelect: (v: string) => void }) {
  const person = VOUCH_PEOPLE.find((p) => p.value === selected);
  return (
    <>
      <DiscordMessage>
        <Embed color="#23a559" author="Verifiziertes Vouch-System · Spawner" footer="TXTClan · Spawner-Vouches: 2540 · Gesamte Vouches: 2610">
          <p className="text-[16px] font-semibold text-white">Neue Bewertung · Vouch #2610</p>
          <p className="mt-1">{stars(5)}</p>
          <Field name="📦 Produkt" value="Skelly" />
          <Field name="⚖️ Menge" value="1" />
          <Field name="💵 Preis" value="12.300.000$" />
          <Field name="👤 Käufer" value={<Mention>@HydraVB | TXT</Mention>} />
          <Field name="🛡️ Verkäufer" value={<Mention>@Hugo</Mention>} />
          <Field name="🗒️ Notiz" value={<blockquote className="quote">war nice</blockquote>} />
        </Embed>
      </DiscordMessage>
      <DiscordMessage>
        <Embed color="#23a559" author="Verifiziertes Vouch-System · Shop" footer="TXTClan · Shop-Vouches: 70 · Gesamte Vouches: 2611">
          <p className="text-[16px] font-semibold text-white">Neue Bewertung · Vouch #2611</p>
          <p className="mt-1">{stars(5)}</p>
          <Field name="📦 Produkt" value="Thorfinn von Vinland Saga" />
          <Field name="⚖️ Menge" value="1" />
          <Field name="💵 Preis" value="$6.000.000" />
          <Field name="👤 Käufer" value={<Mention>@Du</Mention>} />
          <Field name="🛡️ Verkäufer" value={<Mention>@MapSeller</Mention>} />
          <Field name="🗒️ Notiz" value={<blockquote className="quote">Bewertung per DM nach dem Kauf</blockquote>} />
        </Embed>
      </DiscordMessage>
      <DiscordMessage>
        <Embed color="#fee75c" footer="TXTClan · 40 verifizierte Profile · Seite 1 von 1">
          <p className="text-[16px] font-semibold text-white">🔍 Vouch-Auswertung</p>
          <p className="mt-2">
            <strong>Finde schnell die Bewertungen unserer Käufer und Verkäufer.</strong>
          </p>
          <p className="mt-2">Wähle unten eine Person aus, um die vollständige Vouch-Statistik anzusehen.</p>
          <p className="mt-2 text-[#b5bac1]">Ein Panel — immer die letzte Nachricht in diesem Kanal.</p>
        </Embed>
        <SelectBox
          placeholder="Käufer oder Verkäufer auswählen ..."
          options={VOUCH_PEOPLE.map((p) => ({ value: p.value, label: p.label }))}
          onChange={onSelect}
          value={selected ?? ""}
        />
        {person ? (
          <Embed color="#fee75c" footer="TXTClan · Vouch-Auswertung">
            <p className="text-[16px] font-semibold text-white">Vouch-Statistik · {person.label}</p>
            <Field name="Als Käufer" value={`${person.buyer} Vouches`} />
            <Field name="Als Verkäufer" value={`${person.seller} Vouches`} />
            <Field name="Durchschnitt" value={`${person.avg}/5`} />
          </Embed>
        ) : null}
      </DiscordMessage>
    </>
  );
}

function WarningChannel({ extras }: { extras: { text: string; color: string; title?: string }[] }) {
  return (
    <>
      <DiscordMessage>
        <Embed color="#ed4245">
          <p>
            Das <strong>Faken von TXTClan-Accounts</strong> nimmt leider zu. Es gibt verschiedene
            Fake-Accounts, die sich als uns ausgeben.
          </p>
          <p className="mt-3">
            Seid bei Zahlungen <strong>besonders vorsichtig</strong> und prüft, ob ihr den richtigen Account ausgewählt
            habt. Der korrekte Name lautet <Code>TXTClan</Code>.
          </p>
          <p className="mt-3">
            Der sicherste Weg ist, den Zahlungsbefehl <strong>direkt aus der jeweiligen Zahlungsanfrage</strong> zu
            kopieren.
          </p>
          <p className="mt-3">Danke für eure Aufmerksamkeit — bleibt wachsam.</p>
        </Embed>
      </DiscordMessage>
      {extras.map((m, i) => (
        <DiscordMessage key={i}>
          {m.title ? (
            <Embed color={m.color}>
              <p className="text-[16px] font-semibold text-white">{m.title}</p>
              <div className="mt-2">
                <DiscordMarkdown text={m.text} />
              </div>
            </Embed>
          ) : (
            <div className="text-[16px] text-[#dbdee1]">
              <DiscordMarkdown text={m.text} />
            </div>
          )}
        </DiscordMessage>
      ))}
    </>
  );
}

function GiveawayChannel({
  joined,
  count,
  onJoin,
}: {
  joined: boolean;
  count: number;
  onJoin: () => void;
}) {
  return (
    <>
      <DiscordMessage>
        <Embed color="#f0b232">
          <p className="text-[16px] font-semibold text-white">🏆 Gewinner</p>
          <p className="mt-2">
            1. <Mention>@Netherite0815</Mention> — <strong>$2.5M</strong>
          </p>
          <p>
            2. <Mention>@BuilderJo</Mention> — <strong>$2.5M</strong>
          </p>
          <Field name="Gewinnspiel-ID" value={<Code>J69YAwA</Code>} />
        </Embed>
      </DiscordMessage>
      <DiscordMessage>
        <Embed color="#23a559" footer="Klicke auf den Button, um teilzunehmen. | gestern um 20:00 Uhr">
          <p className="text-[16px] font-semibold text-white">🎉 Public Giveaway</p>
          <p className="mt-1">Daily GW</p>
          <Field name="Gewinne" value="• **2x** $2.5M" />
          <Field name="Auflösung" value="Freitag, 28. August 2026 um 19:00 (in 7 Stunden)" />
          <Field name="Regeln" value="Teilnahmebedingungen gemäß internem Gewinnspiel-System" />
          <Field name="Gewinnspiel-ID" value={<Code>hN4nmcM</Code>} />
        </Embed>
        <DiscordButton onClick={onJoin} disabled={joined}>
          {joined ? `Teilgenommen · ${count}` : "Teilnehmen"}
        </DiscordButton>
      </DiscordMessage>
    </>
  );
}

function SpawnerPrice({ amount }: { amount: number | null }) {
  if (amount == null) return <span className="font-semibold text-[#f23f43]">STOP</span>;
  return <Code>{formatMillions(amount)}</Code>;
}

function SpawnerChannel() {
  const spawners: { name: string; emoji: string; buy: number | null; sell: number | null }[] = [
    { name: "Blaze", emoji: "🔥", buy: 4_000_000, sell: null },
    { name: "Cow", emoji: "🐮", buy: 4_000_000, sell: null },
    { name: "Creeper", emoji: "💥", buy: 3_500_000, sell: 5_500_000 },
    { name: "Iron", emoji: "⚙️", buy: 8_000_000, sell: null },
    { name: "Piglin", emoji: "🐷", buy: 4_000_000, sell: null },
    { name: "Skelly", emoji: "💀", buy: 13_100_000, sell: 14_000_000 },
    { name: "Spider", emoji: "🕷️", buy: 4_000_000, sell: null },
  ];
  const [dir, setDir] = useState<"buy" | "sell" | null>(null);
  const [pick, setPick] = useState<string>("");
  const [qty, setQty] = useState(1);
  const chosen = spawners.find((s) => s.name === pick);
  const unit = dir === "buy" ? chosen?.sell : chosen?.buy;
  const total = unit != null ? unit * qty : 0;
  const cmd = dir === "buy" ? payCommand("y3zz", total) : payCommand("DeinName", total);

  return (
    <DiscordMessage>
      <Embed color="#f0b232" author="TXTClan · Spawner-Shop" footer="TXTClan · Spawner-Shop">
        <p className="text-[16px] font-semibold text-white">🧱 Spawner An- & Verkauf</p>
        <p className="mt-2">
          Wir <strong>kaufen</strong> deine Spawner an und <strong>verkaufen</strong> aus dem Lager.
        </p>
        <ul className="mt-2 space-y-0.5 text-[14px]">
          <li>📥 <strong>Ankauf</strong> — das zahlen wir dir</li>
          <li>📤 <strong>Verkauf</strong> — das zahlst du uns</li>
          <li>⛔ <strong>STOP</strong> — gerade nicht möglich</li>
        </ul>
        <p className="mt-3 text-[14px] font-bold text-[#f2f3f5]">Aktuelle Preise</p>
        <div className="mt-2 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          {spawners.map((s) => (
            <div key={s.name} className="rounded-[4px] bg-[#1e1f22] px-2.5 py-2">
              <p className="text-[14px] font-semibold text-[#f2f3f5]">
                {s.emoji} {s.name}
              </p>
              <p className="mt-1 text-[13px] text-[#dbdee1]">
                📥 Ankauf <SpawnerPrice amount={s.buy} />
              </p>
              <p className="text-[13px] text-[#dbdee1]">
                📤 Verkauf <SpawnerPrice amount={s.sell} />
              </p>
            </div>
          ))}
        </div>
        <Field
          name="⚠️ Haftung"
          value="Wir übernehmen nur Verantwortung für Trusted Trader."
        />
        <Field
          name="🔔 Hinweis"
          value="Glocke im Kanal an — dann siehst du, wann wir aktiv sind. Unten ein Ticket öffnen."
        />
      </Embed>
      <DiscordButton
        onClick={() => {
          setDir("sell");
          setPick("");
        }}
      >
        📥 An uns verkaufen
      </DiscordButton>
      <DiscordButton
        variant="primary"
        onClick={() => {
          setDir("buy");
          setPick("");
        }}
      >
        📤 Von uns kaufen
      </DiscordButton>
      {dir && (
        <div className="mt-3 max-w-[520px] rounded bg-[#2b2d31] p-3">
          <p className="mb-2 text-sm text-white">{dir === "buy" ? "Von uns kaufen" : "An uns verkaufen"}</p>
          <SelectBox
            placeholder="Spawner auswählen ..."
            options={spawners
              .filter((s) => (dir === "buy" ? s.sell != null : s.buy != null))
              .map((s) => ({ value: s.name, label: `${s.emoji} ${s.name}` }))}
            onChange={setPick}
            value={pick}
          />
          {chosen && unit != null && (
            <>
              <label className="mt-2 block text-xs text-[#b5bac1]">Menge</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded bg-[#1e1f22] px-3 py-2 text-white"
              />
              <p className="mt-2 text-sm">
                Gesamt: <strong className="text-white">{formatMoney(total)}</strong> ({formatMillions(unit)} × {qty})
              </p>
              <pre className="mt-2 overflow-x-auto rounded bg-[#1e1f22] p-2 font-mono text-[13px]">{cmd}</pre>
            </>
          )}
        </div>
      )}
    </DiscordMessage>
  );
}

function ClanChannel() {
  const [clans, setClans] = useState([
    { name: "TXTClan", filled: 4, max: 30 },
    { name: "TXT2", filled: 12, max: 30 },
  ]);
  const [prices, setPrices] = useState<{ label: string; amount: number }[]>([]);
  const [priceLabel, setPriceLabel] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [phase, setPhase] = useState<"idle" | "pending" | "accepted">("idle");
  const [hint, setHint] = useState<string | null>(null);
  const allFull = clans.length > 0 && clans.every((c) => c.filled >= c.max);

  function removeClan(name: string) {
    setClans((list) => list.filter((c) => c.name !== name));
    setHint(`**${name}** vom Panel genommen. \`/clan entfernen name:${name}\``);
  }

  function savePrice() {
    const label = priceLabel.trim();
    if (!label) {
      setHint("Bezeichnung fehlt. `/clan preis-setzen bezeichnung:… betrag:…`");
      return;
    }
    const amount = parsePrice(priceAmount);
    if (amount == null) {
      removePrice(label);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setHint("Betrag ungültig. Beispiel: `3,0M` — oder `STOP` zum Entfernen.");
      return;
    }
    const exists = prices.some((p) => p.label.toLowerCase() === label.toLowerCase());
    setPrices((list) => {
      const next = list.filter((p) => p.label.toLowerCase() !== label.toLowerCase());
      return [...next, { label, amount }];
    });
    setHint(
      exists
        ? `Preis **${label}** geändert auf \`${formatMillions(amount)}\`. \`/clan preis-setzen bezeichnung:${label} betrag:${priceAmount}\``
        : `Preis **${label}** festgelegt: \`${formatMillions(amount)}\`. \`/clan preis-setzen bezeichnung:${label} betrag:${priceAmount}\``,
    );
    setPriceLabel("");
    setPriceAmount("");
  }

  function removePrice(name: string) {
    const label = name.trim();
    if (!label) {
      setHint("Bezeichnung fehlt. `/clan preis-entfernen bezeichnung:…`");
      return;
    }
    const found = prices.find((p) => p.label.toLowerCase() === label.toLowerCase());
    if (!found) {
      setHint(`Kein Preis **${label}**.`);
      return;
    }
    setPrices((list) => list.filter((p) => p.label.toLowerCase() !== label.toLowerCase()));
    setHint(`Preis **${found.label}** entfernt. \`/clan preis-entfernen bezeichnung:${found.label}\``);
    if (priceLabel.toLowerCase() === found.label.toLowerCase()) {
      setPriceLabel("");
      setPriceAmount("");
    }
  }

  function apply() {
    if (!clans.length) {
      setHint("Keine Clans auf dem Panel.");
      return;
    }
    if (phase === "accepted") {
      setHint("Du bist bereits im Clan. Dein Platz ist gezählt — eine zweite Bewerbung ändert die Zahl nicht.");
      return;
    }
    if (phase === "pending") {
      setHint("Du hast schon eine offene Bewerbung. Plätze bleiben unverändert, bis das Team annimmt.");
      return;
    }
    if (allFull) {
      setHint("Alle Clans auf dem Panel sind voll.");
      return;
    }
    setPhase("pending");
    setHint(`Bewerbung offen bei ${clans[0]?.name}. Plätze unverändert bis zur Annahme.`);
  }

  function accept() {
    if (phase === "accepted") {
      setHint("War bereits angenommen — Platz wurde nicht doppelt gezählt.");
      return;
    }
    setClans((list) => list.map((c, i) => (i === 0 ? { ...c, filled: c.filled + 1 } : c)));
    setPhase("accepted");
    setHint(`Angenommen in ${clans[0]?.name}. Clan-Rolle vergeben.`);
  }

  function reject() {
    setPhase("idle");
    setHint("Abgelehnt. Plätze unverändert.");
  }

  function kick() {
    if (phase === "accepted") {
      setClans((list) => list.map((c, i) => (i === 0 ? { ...c, filled: Math.max(0, c.filled - 1) } : c)));
      setPhase("idle");
      setHint("Platz entfernt.");
      return;
    }
    setPhase("idle");
    setHint("Kein Platz belegt.");
  }

  return (
    <>
      <DiscordMessage>
        <Embed color={allFull ? "#ed4245" : "#23a559"} footer="TXTClan · Clan-System">
          <p className="text-[16px] font-semibold text-white">🤝 Clan-Bewerbung</p>
          <p className="mt-2 text-[#b5bac1]">Wähle den Clan. Team nimmt Clans mit /clan entfernen vom Panel.</p>
          {clans.length ? (
            <div className="mt-3 space-y-2">
              {clans.map((c) => {
                const full = c.filled >= c.max;
                return (
                  <div key={c.name} className="flex items-start justify-between gap-2 rounded bg-[#1e1f22] px-2.5 py-2">
                    <div>
                      <p className="font-semibold text-[#f2f3f5]">{c.name}</p>
                      <p className="text-[13px]">{full ? `🔴 ${c.filled}/${c.max} voll` : `🟢 ${c.filled}/${c.max}`}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded bg-[#da373c] px-2 py-1 text-[12px] text-white"
                      onClick={() => removeClan(c.name)}
                    >
                      Vom Panel
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-[#b5bac1]">Keine Clans. /clan hinzufuegen</p>
          )}
          <p className="mt-3 font-semibold text-white">Preise</p>
          {prices.length ? (
            <div className="mt-1 space-y-1">
              {prices.map((p) => (
                <p key={p.label} className="flex items-center justify-between gap-2">
                  <span>
                    • <strong>{p.label}:</strong> <Code>{formatMillions(p.amount)}</Code> ({formatMoney(p.amount)})
                  </span>
                  <button
                    type="button"
                    className="shrink-0 rounded bg-[#da373c] px-2 py-0.5 text-[11px] text-white"
                    onClick={() => removePrice(p.label)}
                  >
                    Entfernen
                  </button>
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-1 italic text-[#b5bac1]">Keine Preise. Team: /clan preis-setzen / /clan preis-entfernen</p>
          )}
        </Embed>
        <DiscordButton onClick={apply} disabled={!clans.length || (allFull && phase !== "accepted")}>
          {!clans.length ? "Keine Clans" : allFull ? "Clan ist voll" : "Jetzt bewerben"}
        </DiscordButton>
      </DiscordMessage>
      <div className="mx-4 mt-3 max-w-[520px] rounded bg-[#2b2d31] p-3">
        <p className="mb-2 text-sm font-semibold text-white">Team · Preise festlegen, ändern, entfernen</p>
        <p className="mb-2 text-xs text-[#949ba4]">
          Wie in Discord: <Code>/clan preis-setzen</Code> · <Code>/clan preis-entfernen</Code> · Betrag <Code>STOP</Code>{" "}
          löscht die Zeile.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={priceLabel}
            onChange={(e) => setPriceLabel(e.target.value)}
            placeholder="Bezeichnung"
            aria-label="Preisbezeichnung"
            className="min-w-[8rem] flex-1 rounded bg-[#1e1f22] px-2 py-1.5 text-sm text-white outline-none"
          />
          <input
            value={priceAmount}
            onChange={(e) => setPriceAmount(e.target.value)}
            placeholder="3,0M oder STOP"
            aria-label="Preisbetrag"
            className="w-32 rounded bg-[#1e1f22] px-2 py-1.5 text-sm text-white outline-none"
          />
          <DiscordButton onClick={savePrice}>Festlegen</DiscordButton>
          <DiscordButton variant="danger" onClick={() => removePrice(priceLabel)}>
            Entfernen
          </DiscordButton>
        </div>
      </div>
      {phase !== "idle" && clans[0] && (
        <DiscordMessage>
          <Embed color="#23a559" footer="TXTClan · Clan-Bewerbung">
            <p className="text-[16px] font-semibold text-white">🤝 Bewerbung · {clans[0].name}</p>
            <p className="mt-2">
              Hallo <Mention>@Du</Mention>
            </p>
            <p className="mt-2">
              <strong>Plätze aktuell:</strong> {clans[0].filled}/{clans[0].max} — nach Annahme zählt diese Person einmal.
            </p>
            <Field name="Minecraft" value={<Code>DeinName</Code>} />
            <Field name="Über dich" value="PvP + Farm, täglich online." />
          </Embed>
          <div className="mt-2 flex flex-wrap gap-2">
            <DiscordButton onClick={accept}>Annehmen</DiscordButton>
            <DiscordButton variant="secondary" onClick={reject}>
              Ablehnen
            </DiscordButton>
            <DiscordButton variant="danger" onClick={kick}>
              Platz entfernen
            </DiscordButton>
          </div>
        </DiscordMessage>
      )}
      {hint && (
        <p className="mx-4 mt-2 max-w-[520px] rounded bg-[#2b2d31] px-3 py-2 text-sm text-[#dbdee1]">{hint}</p>
      )}
    </>
  );
}

function ServiceChannel({ open, onSelect }: { open: number; onSelect: (name: string) => void }) {
  const full = open >= 10;
  return (
    <DiscordMessage>
      <Embed color="#23a559" footer="TXTClan · Service-System | heute um 11:56 Uhr">
        <p>🏗️ <strong>Schematic Bau Service</strong></p>
        <p className="mb-3">
          Wir bauen dein Schematic in-game. <strong>Wichtig:</strong> Bitte Welt-Download und Maße angeben.
        </p>
        <p className={full ? "text-[#949ba4] line-through" : ""}>
          🧱 <strong>Base/Farm Bau Service</strong>
        </p>
        <p className={`mb-3 ${full ? "text-[#949ba4] line-through" : ""}`}>
          Komplette Bases und Farmen nach Vorgabe.
        </p>
        <p className="mt-2">
          {full ? `🟡 **${open}/10 Tickets – Limit erreicht**` : `🟢 ${open}/10 offene Service-Tickets`}
        </p>
        <p className="mt-3 text-[#b5bac1]">
          Für die Nutzung unserer Services ist ein verifizierter Minecraft-Account erforderlich.
        </p>
      </Embed>
      <SelectBox
        placeholder="Service auswählen ..."
        options={[
          { value: "Schematic Bau", label: "🏗️ Schematic Bau Service" },
          { value: "Base Bau", label: full ? "🧱 Base/Farm Bau (voll)" : "🧱 Base/Farm Bau Service" },
        ]}
        onChange={onSelect}
      />
    </DiscordMessage>
  );
}

function CommandsChannel({
  sayText,
  setSayText,
  sayColor,
  setSayColor,
  onSend,
}: {
  sayText: string;
  setSayText: (v: string) => void;
  sayColor: string;
  setSayColor: (v: string) => void;
  onSend: (title?: string) => void;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [msgTitle, setMsgTitle] = useState("");

  function wrap(before: string, after = before) {
    const el = areaRef.current;
    const start = el?.selectionStart ?? sayText.length;
    const end = el?.selectionEnd ?? sayText.length;
    const selected = sayText.slice(start, end) || "text";
    const next = sayText.slice(0, start) + before + selected + after + sayText.slice(end);
    setSayText(next);
    requestAnimationFrame(() => {
      el?.focus();
      const from = start + before.length;
      el?.setSelectionRange(from, from + selected.length);
    });
  }

  const marks = [
    { label: "Fett", hint: "**", run: () => wrap("**") },
    { label: "Kursiv", hint: "*", run: () => wrap("*") },
    { label: "Unterstrichen", hint: "__", run: () => wrap("__") },
    { label: "Durchgestrichen", hint: "~~", run: () => wrap("~~") },
    { label: "Spoiler", hint: "||", run: () => wrap("||") },
    { label: "Code", hint: "`", run: () => wrap("`") },
  ];

  function sendFromPanel() {
    if (!sayText.trim()) return;
    const title = msgTitle.trim() || undefined;
    setPanelOpen(false);
    setMsgTitle("");
    onSend(title);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4">
      <Embed color="#5865f2" footer="Diese Vorschau zeigt das Look & Feel. Der echte Bot läuft in Discord.">
        <p className="text-[16px] font-semibold text-white">Slash-Befehle</p>
        <p className="mt-2">
          Rufe den Bot mit einem Token in deinem Discord-Server auf. Mehrere Ticket- und Buy-Panels können in beliebige
          Kanäle gesendet werden.
        </p>
        <Field
          name="/msg"
          value="Öffnet ein Textfenster — Nachricht eintragen, Senden postet sie in diesen Kanal"
        />
        <Field name="/sagen · /embed" value="Dasselbe Fenster, optional als Embed / mit Titel" />
        <Field name="/ticket-panel" value="Dropdown wie in #TICKET — beliebig oft, in jeden Kanal" />
        <Field name="/produkt erstellen + /buy-panel" value="Shop-Listing mit Kauf-Button, Preis und Verkäufer" />
        <Field name="/spawner hinzufuegen · setzen · emoji · entfernen" value="Preise, Emojis, Spawner anlegen/löschen — Panel aktualisiert sich" />
        <Field name="/spawner rolle + /spawner-panel" value="Preiskacheln, STOP, eigene Support-Rolle für Spawner-Tickets" />
        <Field name="/clan hinzufuegen · entfernen" value="Clans aufs Panel setzen oder wieder runternehmen" />
        <Field
          name="/clan preis-setzen · preis-entfernen"
          value="Preise selbst festlegen, ändern oder löschen — kein festes Eintritt / Abgabe"
        />
        <Field name="/ticket preis" value="Im Ticket ohne Preis den Betrag setzen → /pay y3zz" />
        <Field name="/pay" value="Zahlungsanfrage mit Gesamtbetrag und kopierbarem /pay y3zz Betrag" />
        <Field name="/giveaway starten" value="Teilnehmen-Button, automatische Auslosung, Reroll" />
        <Field name="/vouch erstellen · /vouch-panel" value="Nur ein Panel — altes wird gelöscht, bleibt am Kanalende" />
        <Field name="/service-panel" value="Services mit Ticket-Limit (z. B. 10/10)" />
      </Embed>
      <div className="rounded-lg bg-[#2b2d31] p-4">
        <p className="mb-2 font-semibold text-white">/msg</p>
        <p className="mb-3 text-sm text-[#b5bac1]">
          Wie in Discord: Befehl ausführen, Textfenster geht auf, Nachricht eintragen, <strong>Senden</strong> — landet
          in diesem Kanal.
        </p>
        <DiscordButton variant="primary" onClick={() => setPanelOpen(true)}>
          /msg
        </DiscordButton>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-[440px] overflow-hidden rounded-lg bg-[#313338] shadow-2xl">
            <div className="flex items-center justify-between px-4 pt-4">
              <p className="text-[20px] font-semibold text-white">Nachricht senden</p>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="text-xl leading-none text-[#b5bac1] hover:text-white"
                aria-label="Schließen"
              >
                ×
              </button>
            </div>
            <p className="px-4 pt-1 text-xs text-[#949ba4]">Danach erscheint die Nachricht im Kanal.</p>
            <div className="space-y-3 p-4">
              <label className="block">
                <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-[#b5bac1]">
                  Titel <span className="font-medium normal-case text-[#80848e]">optional · macht ein Embed</span>
                </span>
                <input
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  placeholder="z. B. Ankündigung"
                  className="w-full rounded bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-[#b5bac1]">
                  Nachricht <span className="text-[#da373c]">*</span>
                </span>
                <div className="mb-1 flex flex-wrap gap-1">
                  {marks.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={m.run}
                      title={`${m.hint}text${m.hint}`}
                      className="rounded bg-[#1e1f22] px-2 py-1 text-xs text-[#dbdee1] hover:bg-[#111214]"
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={areaRef}
                  value={sayText}
                  onChange={(e) => setSayText(e.target.value)}
                  placeholder={"**Willkommen**\nShop ist *online*."}
                  className="h-32 w-full resize-y rounded bg-[#1e1f22] p-3 text-sm text-white outline-none"
                />
              </label>
              {sayText.trim() ? (
                <div className="rounded bg-[#1e1f22] p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#949ba4]">Vorschau</p>
                  {msgTitle.trim() ? <p className="mb-1 font-semibold text-white">{msgTitle.trim()}</p> : null}
                  <DiscordMarkdown text={sayText} />
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#949ba4]">Farbe</span>
                {["#ed4245", "#23a559", "#fee75c", "#5865f2"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSayColor(c)}
                    className={`h-6 w-6 overflow-hidden rounded-full border-2 ${sayColor === c ? "border-white" : "border-transparent"}`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 bg-[#2b2d31] px-4 py-3">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded px-4 py-2 text-sm font-medium text-[#dbdee1] hover:underline"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={sendFromPanel}
                disabled={!sayText.trim()}
                className="rounded bg-[#5865f2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752c4] disabled:opacity-50"
              >
                Senden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketView({
  ticket,
  copied,
  onCopy,
}: {
  ticket: Ticket;
  copied: boolean;
  onCopy: (cmd: string) => void;
}) {
  const [pay, setPay] = useState<{ total: number; unit: number; product: string; qty: number } | null>(
    ticket.kind === "buy" && ticket.total && ticket.unitPrice
      ? {
          total: ticket.total,
          unit: ticket.unitPrice,
          product: ticket.product ?? PRODUCT.name,
          qty: ticket.quantity ?? 1,
        }
      : null,
  );
  const [draft, setDraft] = useState("5,0M");
  const [closed, setClosed] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  function parseDraft(raw: string) {
    const t = raw.trim().toUpperCase().replace(/\s/g, "");
    if (t.endsWith("M")) return Math.round(Number(t.slice(0, -1).replace(",", ".")) * 1_000_000);
    return Math.round(Number(t.replace(/\./g, "").replace(",", ".")));
  }

  if (closed) {
    return (
      <DiscordMessage>
        <Embed color="#fee75c" footer="Direktnachricht · Bewertung nach dem Kauf">
          <p className="text-[16px] font-semibold text-white">⭐ Wie war der Kauf?</p>
          <p className="mt-2">
            Danke für deinen Einkauf. Bitte bewerte mit 1–5 Sternen. Die Bewertung erscheint als Vouch auf dem Server.
          </p>
        </Embed>
        <div className="mt-2 flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <DiscordButton key={n} variant={n >= 4 ? "success" : "secondary"} onClick={() => setRating(n)}>
              {n}★
            </DiscordButton>
          ))}
        </div>
        {rating != null && (
          <p className="mt-2 text-sm text-[#23a559]">Danke — {rating}/5 Sterne wurden als Vouch veröffentlicht.</p>
        )}
      </DiscordMessage>
    );
  }

  if (pay) {
    const cmd = payCommand("y3zz", pay.total);
    return (
      <DiscordMessage>
        <p className="mb-2 text-sm">
          <Mention>@Du</Mention> · <Mention>@Team</Mention>
        </p>
        <Embed color="#23a559" footer="TXTClan · Bestellung">
          <p className="text-[16px] font-semibold text-white">💳 Zahlungsanfrage</p>
          <p className="mt-2">
            Hallo <Mention>@Du</Mention>, hier ist deine Bestellung. Bitte überweise den Betrag <strong>nur</strong> mit
            dem Befehl aus dieser Nachricht.
          </p>
          <Field name="📦 Produkt" value={pay.product} />
          <Field name="⚖️ Menge" value={String(pay.qty)} />
          <Field name="💵 Einzelpreis" value={formatMoney(pay.unit)} />
          <Field
            name="💰 Gesamt"
            value={<span className="text-[16px] font-bold text-white">{formatMoney(pay.total)}</span>}
          />
          <Field name="👤 Zahlungsempfänger" value={<Code>y3zz</Code>} />
          <Field
            name="Zahlungsbefehl — bitte kopieren"
            value={
              <pre className="mt-1 overflow-x-auto rounded bg-[#1e1f22] p-2 font-mono text-[13px] text-[#dbdee1]">{cmd}</pre>
            }
          />
        </Embed>
        <DiscordButton onClick={() => onCopy(cmd)}>{copied ? "Kopiert" : "Befehl kopieren"}</DiscordButton>
        <DiscordButton variant="primary">Übernehmen</DiscordButton>
        <DiscordButton variant="danger" onClick={() => setClosed(true)}>
          Schließen
        </DiscordButton>
      </DiscordMessage>
    );
  }

  return (
    <DiscordMessage>
      <p className="mb-2 text-sm">
        <Mention>@Du</Mention> · <Mention>@Team</Mention>
      </p>
      <Embed color="#23a559" footer="TXTClan · Ticket-System">
        <p className="text-[16px] font-semibold text-white">{ticket.title}</p>
        <p className="mt-2">Hallo, beschreibe bitte dein Anliegen. Das Team wird sich so schnell wie möglich bei dir melden.</p>
        <p className="mt-2 text-[#b5bac1]">Noch kein Preis — Team: Betrag setzen, dann erscheint /pay y3zz.</p>
      </Embed>
      <div className="mt-2 flex max-w-[520px] flex-wrap items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-28 rounded bg-[#1e1f22] px-2 py-1.5 text-sm text-white"
          aria-label="Preis"
        />
        <DiscordButton
          onClick={() => {
            const amount = parseDraft(draft);
            if (!Number.isFinite(amount) || amount <= 0) return;
            setPay({ total: amount, unit: amount, product: ticket.title, qty: 1 });
          }}
        >
          Preis festlegen
        </DiscordButton>
        <DiscordButton variant="primary">Übernehmen</DiscordButton>
        <DiscordButton variant="danger">Schließen</DiscordButton>
      </div>
    </DiscordMessage>
  );
}
