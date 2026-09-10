import type { ReactNode } from "react";

export function BotAvatar() {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#111] shadow-sm">
      <img src="/fwm-logo.svg" alt="" className="h-full w-full rounded-full object-cover" />
    </div>
  );
}

export function BotName() {
  return (
    <div className="mb-0.5 flex flex-wrap items-baseline gap-1.5">
      <span className="text-[1rem] font-medium text-[#f2f3f5]">TXTClan Bot</span>
      <span className="relative top-px rounded-[3px] bg-[#5865f2] px-[4px] py-[1px] text-[10px] font-bold uppercase tracking-wide text-white">
        App
      </span>
      <span className="text-xs text-[#949ba4]">heute um 12:04 Uhr</span>
    </div>
  );
}

export function DiscordMessage({ children }: { children: ReactNode }) {
  return (
    <article className="flex gap-4 px-4 py-2 hover:bg-[#2e3035]/60">
      <BotAvatar />
      <div className="min-w-0 flex-1">
        <BotName />
        {children}
      </div>
    </article>
  );
}

export function Embed({
  color,
  children,
  footer,
  image,
  author,
}: {
  color: string;
  children: ReactNode;
  footer?: string;
  image?: string;
  author?: string;
}) {
  return (
    <div className="mt-1 grid max-w-[520px] grid-cols-[4px_1fr] overflow-hidden rounded-[4px] bg-[#2b2d31]">
      <div style={{ background: color }} />
      <div className="p-3 pr-4">
        {author ? (
          <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-[#f2f3f5]">
            <img src="/fwm-logo.svg" alt="" className="h-6 w-6 rounded-full object-cover" />
            {author}
          </div>
        ) : null}
        <div className="text-[14px] leading-[1.375] text-[#dbdee1]">{children}</div>
        {image ? (
          <img src={image} alt="" className="mt-3 max-h-80 w-full rounded-[4px] object-cover" />
        ) : null}
        {footer ? <div className="mt-2 text-[12px] font-medium text-[#949ba4]">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ name, value }: { name: string; value: ReactNode }) {
  return (
    <div className="mt-2">
      <div className="text-[14px] font-bold text-[#f2f3f5]">{name}</div>
      <div className="text-[14px] text-[#dbdee1]">{value}</div>
    </div>
  );
}

export function DiscordButton({
  variant = "success",
  children,
  onClick,
  disabled,
}: {
  variant?: "success" | "primary" | "danger" | "secondary";
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const colors = {
    success: "bg-[#248046] hover:bg-[#1a6334] text-white",
    primary: "bg-[#5865f2] hover:bg-[#4752c4] text-white",
    danger: "bg-[#da373c] hover:bg-[#a12828] text-white",
    secondary: "bg-[#4e5058] hover:bg-[#6d6f78] text-white",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`mt-1 mr-1 inline-flex h-8 items-center overflow-hidden rounded-[3px] border-0 px-4 text-[14px] font-medium disabled:opacity-50 ${colors[variant]}`}
    >
      {children}
    </button>
  );
}

export function SelectBox({
  placeholder,
  options,
  onChange,
  value,
}: {
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  value?: string;
}) {
  return (
    <div className="relative mt-1 max-w-[520px]">
      <select
        value={value ?? ""}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        className="h-11 w-full appearance-none rounded-[4px] border-none bg-[#1e1f22] px-3 pr-10 text-[14px] text-[#dbdee1] outline-none ring-0"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#b5bac1]">▾</span>
    </div>
  );
}

export function Mention({ children }: { children: ReactNode }) {
  return <span className="rounded-[3px] bg-[#5865f2]/30 px-1 font-medium text-[#c9cdfb]">{children}</span>;
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[3px] bg-[#1e1f22] px-1 py-0.5 font-mono text-[13px] text-[#dbdee1]">{children}</code>
  );
}
