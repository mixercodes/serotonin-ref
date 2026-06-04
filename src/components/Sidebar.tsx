"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { pagesBySection, type PageSection } from "@/lib/pages";
import PageIcon from "./PageIcon";

const SECTION_LABELS: Record<PageSection, string> = {
  foundation: "Runtime",
  library: "Libraries",
  userdata: "Userdata",
  tool: "Tools",
};

const SECTION_ORDER: PageSection[] = ["foundation", "library", "userdata", "tool"];

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


export default function Sidebar() {
  const pathname = usePathname();
  const bySection = pagesBySection();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      } else {
        setCollapsed(false);
      }
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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "shrink-0 border-r border-bg-border bg-bg-surface flex-col overflow-hidden",
          "transition-[width] duration-200 ease-in-out",
          "fixed inset-y-0 left-0 z-30 w-60",
          "md:relative md:z-auto",
          collapsed ? "md:w-12" : "md:w-60",
          mobileOpen ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        {/* Logo / header */}
        <div className="h-14 shrink-0 flex items-center border-b border-bg-border px-2">
          {collapsed ? (
            <div className="flex items-center justify-center w-full">
              <Link href="/" aria-label="Home">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                     style={{ background: "var(--accent)" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="3.5" fill="white" opacity="0.9" />
                    <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.2" opacity="0.4" />
                  </svg>
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full px-2">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: "var(--accent)" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="3.5" fill="white" opacity="0.9" />
                    <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.2" opacity="0.4" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[--text-heading] group-hover:text-[--accent-light] transition-colors">
                  serotonin
                </span>
                <span className="text-xs font-mono bg-bg-elevated px-1.5 py-0.5 rounded text-[--text-muted]">
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

        {collapsed && (
          <div className="hidden md:flex justify-center py-2 border-b border-bg-border">
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
        <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? "px-1" : "px-2"}`}>
          {SECTION_ORDER.map((section) => {
            const pages = bySection[section];
            if (!pages.length) return null;
            return (
              <div key={section} className="mb-5">
                {!collapsed && (
                  <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[--text-muted]">
                    {SECTION_LABELS[section]}
                  </div>
                )}
                <ul className="space-y-0.5">
                  {pages.map((page) => {
                    const href = `/docs/${page.slug}`;
                    const active = pathname === href;
                    return (
                      <li key={page.slug}>
                        <Link
                          href={href}
                          title={collapsed ? page.title : undefined}
                          className={[
                            "flex items-center rounded-md text-sm transition-all",
                            collapsed ? "justify-center px-1 py-2" : "gap-2 px-3 py-1.5",
                            active
                              ? "sidebar-item-active font-medium"
                              : "text-[--text-muted] hover:text-[--text] hover:bg-bg-elevated",
                          ].join(" ")}
                        >
                          <span className={`shrink-0 ${
                            section === "foundation" ? "text-[--accent]" :
                            section === "userdata"   ? "text-[--accent-2]" :
                            "text-[--text-muted]"
                          }`}>
                            <PageIcon slug={page.slug} size={collapsed ? 15 : 12} />
                          </span>
                          {!collapsed && (
                            <span className="font-mono">{page.title}</span>
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
      </aside>
    </>
  );
}
