import type { DocPage, PageSection } from "@/lib/pages";

const SECTION_META: Record<PageSection, { label: string; color: string }> = {
  library:    { label: "library",  color: "#58a6ff" },
  userdata:   { label: "userdata", color: "#39c5cf" },
  foundation: { label: "guide",    color: "#3fb950" },
  roblox:     { label: "roblox",   color: "#58a6ff" },
  tool:       { label: "tool",     color: "#ffa657" },
};

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold font-mono whitespace-nowrap"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

/** rbxcli-style badge row shown above the page title. */
export default function DocBadges({ page, memberCount }: { page: DocPage; memberCount?: number }) {
  const meta = SECTION_META[page.section];
  const name = page.title;
  const usage =
    page.section === "library" ? `${name}.*` :
    page.section === "userdata" ? `${name}` :
    null;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      <Pill color={meta.color}>{meta.label}</Pill>
      {usage && <Pill color="#8b949e">{usage}</Pill>}
      {memberCount ? <Pill color="#8b949e">{memberCount} functions</Pill> : null}
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[--text-muted]">
        <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#3fb950]" /> runtime-verified
      </span>
    </div>
  );
}
