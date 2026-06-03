"use client";

import Link from "next/link";
import ThemeSelector from "./ThemeSelector";
import type { SearchEntry } from "@/lib/search-data";

function MobileMenuButton() {
  return (
    <button
      className="md:hidden p-1.5 rounded text-[--text-muted] hover:text-[--text] hover:bg-bg-elevated transition-colors"
      onClick={() => window.dispatchEvent(new CustomEvent("serotonin:sidebar-toggle"))}
      aria-label="Toggle navigation"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// The search modal is rendered globally in layout.tsx.
// Clicking this button dispatches a custom event the modal listens for.
function SearchTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("serotonin:search-open"))}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-bg-border bg-bg-elevated text-xs text-[--text-muted] hover:text-[--text] hover:border-[--accent] transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      <span>Search</span>
      <span
        className="ml-1 px-1 py-0.5 rounded text-[10px] font-mono"
        style={{ background: "var(--bg-border)", color: "var(--text-muted)" }}
      >
        ⌘K
      </span>
    </button>
  );
}

export default function TopNav({ searchIndex: _ }: { searchIndex?: SearchEntry[] }) {
  return (
    <header className="h-14 flex items-center justify-between gap-4 px-4 md:px-6 border-b border-bg-border bg-bg-surface sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <MobileMenuButton />
        <span className="text-xs text-[--text-muted] font-mono truncate">
          Serotonin Lua API Reference
        </span>
        <span className="text-[--bg-border]">·</span>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded border"
          style={{
            color: "var(--accent-light)",
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
            borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        >
          v1.0.0
        </span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <SearchTrigger />
        <ThemeSelector />
        <div className="w-px h-4 bg-bg-border" />
        <Link
          href="/docs/quick-start"
          className="text-xs text-[--text-muted] hover:text-[--text] transition-colors"
        >
          Docs
        </Link>
        <Link
          href="/docs/mcp-ai-setup"
          className="text-xs text-[--text-muted] hover:text-[--text] transition-colors"
        >
          MCP
        </Link>
      </div>
    </header>
  );
}
