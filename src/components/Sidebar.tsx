"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pagesBySection, type PageSection } from "@/lib/pages";
import PageIcon from "./PageIcon";

const SECTION_LABELS: Record<PageSection, string> = {
  foundation: "Runtime",
  library: "Libraries",
  userdata: "Userdata",
  tool: "Tools",
};

const SECTION_ORDER: PageSection[] = ["foundation", "library", "userdata", "tool"];

const SECTION_ACCENT: Record<PageSection, string> = {
  foundation: "text-[--accent]",
  library: "text-[--text-muted]",
  userdata: "text-[--accent-2]",
  tool: "text-[--accent-light]",
};

function ChevronLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Logo() {
  return (
    <span className="relative w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
      <span className="absolute inset-0 opacity-40"
            style={{ background: "radial-gradient(circle at 30% 25%, white, transparent 60%)" }} />
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative">
        <circle cx="7" cy="7" r="3.3" fill="white" opacity="0.95" />
        <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.2" opacity="0.45" />
      </svg>
    </span>
  );
}

export default function Sidebar({ buildLabel }: { buildLabel?: string }) {
  const pathname = usePathname();
  const bySection = pagesBySection();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
      else setCollapsed(false);
    };
    if (window.innerWidth < 768) setCollapsed(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handler = () => setMobileOpen((o) => !o);
    window.addEventListener("serotonin:sidebar-toggle", handler);
    return () => window.removeEventListener("serotonin:sidebar-toggle", handler);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const openSearch = () => window.dispatchEvent(new CustomEvent("serotonin:search-open"));

  return (
    <>
      {/* Floating mobile controls (the topbar was removed) */}
      {!mobileOpen && (
        <div className="md:hidden fixed top-3 left-3 z-30 flex items-center gap-1.5 rounded-full border border-bg-border bg-bg-surface/85 backdrop-blur-md p-1 shadow-lg shadow-black/30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-full text-[--text-muted] hover:text-[--text] hover:bg-bg-elevated transition-colors"
            aria-label="Open navigation"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={openSearch}
            className="p-1.5 rounded-full text-[--text-muted] hover:text-[--text] hover:bg-bg-elevated transition-colors"
            aria-label="Search"
          >
            <svg width="15" height="15" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-20 md:hidden bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={[
          "shrink-0 border-r border-bg-border bg-bg-surface/80 backdrop-blur-xl flex-col overflow-hidden z-30",
          "transition-[width] duration-300 ease-in-out",
          "fixed inset-y-0 left-0 w-64",
          "md:relative md:z-auto",
          collapsed ? "md:w-[3.25rem]" : "md:w-60",
          mobileOpen ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        {/* Header */}
        <div className="h-14 shrink-0 flex items-center border-b border-bg-border px-2.5">
          {collapsed ? (
            <Link href="/" aria-label="Home" className="flex items-center justify-center w-full">
              <Logo />
            </Link>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Link href="/" className="flex items-center gap-2 group">
                <Logo />
                <span className="text-[13px] font-bold tracking-tight text-[--text-heading] group-hover:text-[--accent-light] transition-colors">
                  serotonin
                </span>
                <span className="text-[10px] font-mono bg-bg-elevated px-1.5 py-0.5 rounded text-[--text-muted]">
                  ref
                </span>
              </Link>
              <button
                onClick={() => setCollapsed(true)}
                className="hidden md:flex p-1 rounded text-[--text-muted] hover:text-[--text] hover:bg-bg-elevated transition-colors shrink-0"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft />
              </button>
            </div>
          )}
        </div>

        {/* Search trigger */}
        <div className={`shrink-0 ${collapsed ? "px-1 py-2" : "px-2.5 pt-3 pb-1"}`}>
          <button
            onClick={openSearch}
            title={collapsed ? "Search (⌘K)" : undefined}
            className={[
              "group flex items-center rounded-lg border border-bg-border bg-bg-base/60",
              "text-[--text-muted] hover:text-[--text] hover:border-[--accent] transition-colors",
              collapsed ? "justify-center w-9 h-9 mx-auto" : "gap-2 w-full px-2.5 py-1.5",
            ].join(" ")}
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {!collapsed && (
              <>
                <span className="text-xs">Search</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-elevated text-[--text-faint] group-hover:text-[--text-muted] transition-colors">
                  ⌘K
                </span>
              </>
            )}
          </button>
        </div>

        {collapsed && (
          <div className="hidden md:flex justify-center py-1.5 border-b border-bg-border">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded text-[--text-muted] hover:text-[--text] hover:bg-bg-elevated transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronRight />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-2 ${collapsed ? "px-1" : "px-2"}`}>
          {SECTION_ORDER.map((section) => {
            const pages = bySection[section];
            if (!pages.length) return null;
            return (
              <div key={section} className="mb-3.5">
                {!collapsed && (
                  <div className="px-2.5 mb-1 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[--text-faint]">
                    {SECTION_LABELS[section]}
                  </div>
                )}
                <ul className="space-y-px">
                  {pages.map((page) => {
                    const href = `/docs/${page.slug}`;
                    const active = pathname === href;
                    return (
                      <li key={page.slug} className="relative">
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-md border border-[color-mix(in_srgb,var(--accent)_40%,transparent)]"
                            style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
                            transition={{ type: "spring", stiffness: 520, damping: 38 }}
                          />
                        )}
                        <Link
                          href={href}
                          title={collapsed ? page.title : undefined}
                          className={[
                            "relative flex items-center rounded-md transition-colors",
                            collapsed ? "justify-center px-1 py-2" : "gap-2 px-2.5 py-[5px]",
                            active
                              ? "sidebar-item-active font-medium"
                              : "text-[--text-muted] hover:text-[--text] hover:bg-bg-elevated/60",
                          ].join(" ")}
                        >
                          <span className={`shrink-0 transition-transform group-hover:scale-110 ${active ? "text-[--accent-light]" : SECTION_ACCENT[section]}`}>
                            <PageIcon slug={page.slug} size={collapsed ? 15 : 12} />
                          </span>
                          {!collapsed && (
                            <span className="font-mono text-[12.5px] truncate">{page.title}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer: build info + links */}
        <div className="shrink-0 border-t border-bg-border">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 py-2.5">
              <a href="https://github.com/mixercodes/serotonin-ref" target="_blank" rel="noopener noreferrer"
                 className="text-[--text-muted] hover:text-[--text] transition-colors" aria-label="GitHub">
                <GithubIcon />
              </a>
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-[--accent-2]" title={buildLabel} />
            </div>
          ) : (
            <div className="px-2.5 py-2.5 space-y-2">
              <div className="flex items-center gap-3 text-[11px]">
                <Link href="/docs/quick-start" className="text-[--text-muted] hover:text-[--accent-light] transition-colors">Docs</Link>
                <Link href="/docs/mcp-ai-setup" className="text-[--text-muted] hover:text-[--accent-light] transition-colors">MCP</Link>
                <a href="https://github.com/mixercodes/serotonin-ref" target="_blank" rel="noopener noreferrer"
                   className="ml-auto text-[--text-muted] hover:text-[--text] transition-colors" aria-label="GitHub">
                  <GithubIcon />
                </a>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[--text-faint]">
                <span className="live-dot w-1.5 h-1.5 rounded-full bg-[--accent-2] shrink-0" />
                <span className="truncate">{buildLabel ?? "dev"}</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function GithubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}
