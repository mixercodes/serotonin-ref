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

export default function TopNav({ searchIndex: _, buildLabel }: { searchIndex?: SearchEntry[]; buildLabel?: string }) {
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
          {buildLabel ?? "dev"}
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
        <a
          href="https://github.com/mixercodes/serotonin-ref"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[--text-muted] hover:text-[--text] transition-colors"
          aria-label="GitHub"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
      </div>
    </header>
  );
}
