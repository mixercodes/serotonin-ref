"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "default" | "gruvbox" | "nord" | "catppuccin";

const THEMES: { id: Theme; label: string; accent: string; bg: string }[] = [
  { id: "gruvbox",    label: "Gruvbox",    accent: "#fe8019", bg: "#282828" },
  { id: "default",    label: "VS Code",    accent: "#569cd6", bg: "#1e1e1e" },
  { id: "nord",       label: "Nord",       accent: "#88c0d0", bg: "#2e3440" },
  { id: "catppuccin", label: "Catppuccin", accent: "#cba6f7", bg: "#1e1e2e" },
];

export default function ThemeSelector() {
  const [current, setCurrent] = useState<Theme>("gruvbox");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) setCurrent(saved);
  }, []);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  function apply(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    setCurrent(theme);
    setOpen(false);
  }

  const active = THEMES.find((t) => t.id === current) ?? THEMES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[--text-muted] hover:text-[--text] hover:bg-bg-elevated transition-colors"
        title="Change theme"
      >
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: active.accent }}
        />
        <span className="text-xs font-mono hidden sm:block">{active.label}</span>
        <svg
          width="8" height="8" viewBox="0 0 8 8" fill="none"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 rounded-lg border border-bg-border shadow-xl z-50 overflow-hidden min-w-[152px]"
          style={{ background: "var(--bg-surface)" }}
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => apply(t.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[--bg-elevated]"
              style={{ color: current === t.id ? "var(--text)" : "var(--text-muted)" }}
            >
              <span
                className="relative w-4 h-4 rounded shrink-0 overflow-hidden"
                style={{ backgroundColor: t.bg, border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span
                  className="absolute inset-0 m-auto w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.accent }}
                />
              </span>
              <span className="font-mono text-xs">{t.label}</span>
              {current === t.id && (
                <svg className="ml-auto shrink-0" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L3.5 7.5L8.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
