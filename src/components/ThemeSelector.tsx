"use client";

import { useEffect, useState } from "react";

type Theme = "default" | "gruvbox" | "nord" | "catppuccin";

const THEMES: { id: Theme; label: string; dot: string }[] = [
  { id: "default",    label: "Default",    dot: "#c0c0c0" },
  { id: "gruvbox",    label: "Gruvbox",    dot: "#fe8019" },
  { id: "nord",       label: "Nord",       dot: "#88c0d0" },
  { id: "catppuccin", label: "Catppuccin", dot: "#cba6f7" },
];

export default function ThemeSelector() {
  const [current, setCurrent] = useState<Theme>("default");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) apply(saved);
  }, []);

  function apply(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    setCurrent(theme);
  }

  return (
    <div className="flex items-center gap-1.5">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => apply(t.id)}
          title={t.label}
          className="w-3.5 h-3.5 rounded-full transition-all hover:scale-125 focus:outline-none"
          style={{
            backgroundColor: t.dot,
            boxShadow: current === t.id ? `0 0 0 2px var(--bg-surface), 0 0 0 3px ${t.dot}` : undefined,
            opacity: current === t.id ? 1 : 0.45,
          }}
        />
      ))}
    </div>
  );
}
