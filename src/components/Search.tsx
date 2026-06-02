"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchEntry } from "@/lib/search-data";
import type { PageSection } from "@/lib/pages";

interface Result extends SearchEntry {
  snippet: string;
  score: number;
}

const SECTION_BADGE: Record<PageSection, string> = {
  foundation: "runtime",
  library:    "lib",
  userdata:   "ud",
  tool:       "tool",
};

function runSearch(query: string, index: SearchEntry[]): Result[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);

  return index
    .map((entry) => {
      const titleLc = entry.title.toLowerCase();
      const textLc  = entry.text.toLowerCase();
      let score = 0;

      if (titleLc === q)          score += 200;
      if (titleLc.startsWith(q))  score += 100;
      if (titleLc.includes(q))    score += 60;
      words.forEach((w) => { if (titleLc.includes(w)) score += 20; });

      let snippet = "";
      const idx = textLc.indexOf(q);
      if (idx !== -1) {
        score += 40;
        const s = Math.max(0, idx - 60);
        const e = Math.min(entry.text.length, idx + q.length + 120);
        snippet = (s > 0 ? "…" : "") + entry.text.slice(s, e).trimStart() + (e < entry.text.length ? "…" : "");
      } else {
        for (const w of words) {
          const wi = textLc.indexOf(w);
          if (wi !== -1) {
            score += 10;
            if (!snippet) {
              const s = Math.max(0, wi - 60);
              const e = Math.min(entry.text.length, wi + w.length + 120);
              snippet = (s > 0 ? "…" : "") + entry.text.slice(s, e).trimStart() + "…";
            }
          }
        }
      }

      return { ...entry, snippet, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function highlight(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "var(--accent)", color: "var(--bg-base)", borderRadius: "2px", padding: "0 2px", fontStyle: "normal" }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function Search({ index }: { index: SearchEntry[] }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [cursor, setCursor]   = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLUListElement>(null);
  const router   = useRouter();

  const openModal = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const kbd = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openModal(); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", kbd);
    window.addEventListener("serotonin:search-open", openModal);
    return () => {
      window.removeEventListener("keydown", kbd);
      window.removeEventListener("serotonin:search-open", openModal);
    };
  }, [openModal]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Scroll active result into view
  useEffect(() => {
    const item = listRef.current?.children[cursor] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const handleQuery = useCallback((q: string) => {
    setQuery(q);
    setCursor(0);
    setResults(runSearch(q, index));
  }, [index]);

  const navigate = useCallback((result: Result) => {
    setOpen(false);
    if (query) sessionStorage.setItem("search-query", query);
    const hash = result.anchor ? `#${result.anchor}` : "";
    router.push(`/docs/${result.slug}${hash}`);
  }, [router, query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) navigate(results[cursor]);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-xl border border-bg-border overflow-hidden shadow-2xl"
        style={{ background: "var(--bg-surface)" }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-bg-border">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search docs…"
            className="flex-1 py-4 bg-transparent text-sm outline-none placeholder:text-[--text-muted] text-[--text]"
          />
          <button
            onClick={() => setOpen(false)}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-bg-border text-[--text-muted] hover:text-[--text] transition-colors"
          >
            esc
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul ref={listRef} className="max-h-96 overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={`${r.slug}#${r.anchor ?? ""}`}>
                <button
                  onClick={() => navigate(r)}
                  onMouseEnter={() => setCursor(i)}
                  className="w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors"
                  style={{ background: i === cursor ? "var(--bg-elevated)" : "transparent" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: "var(--bg-border)", color: "var(--text-muted)" }}
                    >
                      {SECTION_BADGE[r.section]}
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--text-heading)" }}>
                      {highlight(r.title, query)}
                    </span>
                  </div>
                  {r.snippet && (
                    <p className="text-xs leading-relaxed line-clamp-2 pl-10" style={{ color: "var(--text-muted)" }}>
                      {highlight(r.snippet, query)}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No results for <span style={{ color: "var(--text)" }}>&ldquo;{query}&rdquo;</span>
          </div>
        )}

        {!query && (
          <div className="px-4 py-4 text-xs flex items-center gap-4" style={{ color: "var(--text-muted)" }}>
            <span><span className="font-mono">↑↓</span> navigate</span>
            <span><span className="font-mono">↵</span> open</span>
            <span><span className="font-mono">esc</span> close</span>
          </div>
        )}
      </div>
    </div>
  );
}
