"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { pagesBySection, type PageSection } from "@/lib/pages";

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

function PageIcon({ slug, size }: { slug: string; size: number }) {
  const w = (children: React.ReactNode) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  );
  const s = "currentColor";

  switch (slug) {
    /* ── Foundation ─────────────────────────────────────────── */
    case "quick-start": return w(
      <path d="M3 2L10 6L3 10V2Z" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
    );
    case "pitfalls": return w(<>
      <path d="M6 2L11 10H1L6 2Z" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M6 5V7.5" stroke={s} strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="6" cy="9.2" r="0.65" fill={s}/>
    </>);
    case "audit-notes": return w(<>
      <rect x="2.5" y="2" width="7" height="8.5" rx="1" stroke={s} strokeWidth="1.2"/>
      <path d="M4.5 4.5H7.5M4.5 6.5H7.5M4.5 8.5H6.5" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M5 2V3H7V2" stroke={s} strokeWidth="1.1" strokeLinejoin="round"/>
    </>);
    case "mcp-ai-setup": return w(<>
      <circle cx="6" cy="2.5" r="1.3" stroke={s} strokeWidth="1.2"/>
      <circle cx="2.5" cy="9" r="1.3" stroke={s} strokeWidth="1.2"/>
      <circle cx="9.5" cy="9" r="1.3" stroke={s} strokeWidth="1.2"/>
      <path d="M5 3.5L3.2 8M7 3.5L8.8 8M3.8 9H8.2" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
    </>);

    /* ── Libraries ──────────────────────────────────────────── */
    case "libraries/utility": return w(<>
      <circle cx="8.5" cy="3" r="2" stroke={s} strokeWidth="1.2"/>
      <path d="M7 4.5L2 10" stroke={s} strokeWidth="2" strokeLinecap="round"/>
    </>);
    case "libraries/memory": return w(<>
      <rect x="3" y="3.5" width="6" height="5" rx="0.5" stroke={s} strokeWidth="1.2"/>
      <path d="M4.5 3.5V2M6 3.5V2M7.5 3.5V2M4.5 8.5V10M6 8.5V10M7.5 8.5V10" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
    </>);
    case "libraries/entity": return w(<>
      <circle cx="6" cy="6" r="3.5" stroke={s} strokeWidth="1.2"/>
      <circle cx="6" cy="6" r="1.2" stroke={s} strokeWidth="1.2"/>
      <path d="M6 2V3M6 9V10M2 6H3M9 6H10" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
    </>);
    case "libraries/game": return w(<>
      <rect x="1.5" y="3.5" width="9" height="5.5" rx="2" stroke={s} strokeWidth="1.2"/>
      <path d="M4 6V5.5M4 6V6.5M4 6H3.5M4 6H4.5" stroke={s} strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="7.5" cy="5.7" r="0.65" fill={s}/>
      <circle cx="9" cy="5.7" r="0.65" fill={s}/>
      <circle cx="8.25" cy="7.2" r="0.65" fill={s}/>
    </>);
    case "libraries/cheat": return w(
      <path d="M6 1L10.5 3V6.5C10.5 8.5 8.5 10.5 6 11C3.5 10.5 1.5 8.5 1.5 6.5V3L6 1Z" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
    );
    case "libraries/bit": return w(<>
      {/* AND gate */}
      <path d="M3 2.5H6.5C9 2.5 9 9.5 6.5 9.5H3V2.5Z" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M2 4.5H3M2 7.5H3M9 6H10.5" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
    </>);
    case "libraries/file": return w(<>
      <path d="M3 1.5H8L9.5 3V10.5H3V1.5Z" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8 1.5V3H9.5" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M4.5 5H7.5M4.5 6.5H7.5M4.5 8H6.5" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
    </>);
    case "libraries/audio": return w(<>
      <path d="M2 4.5H4L7 2.5V9.5L4 7.5H2V4.5Z" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M9 3.5C10 4.5 10 7.5 9 8.5M8 5C8.5 5.5 8.5 6.5 8 7" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
    </>);
    case "libraries/mouse": return w(<>
      <path d="M6 1C4 1 3 2.5 3 4V7.5C3 9.5 4.3 11 6 11C7.7 11 9 9.5 9 7.5V4C9 2.5 8 1 6 1Z" stroke={s} strokeWidth="1.2"/>
      <path d="M6 1V5.5M3 5.5H9" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
    </>);
    case "libraries/keyboard": return w(<>
      <rect x="1.5" y="3" width="9" height="6.5" rx="1" stroke={s} strokeWidth="1.2"/>
      <path d="M3 5H4M5.5 5H6.5M8 5H9" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 7H4M5.5 7H6.5M8 7H9" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5H8" stroke={s} strokeWidth="1.3" strokeLinecap="round"/>
    </>);
    case "libraries/http": return w(<>
      <circle cx="6" cy="6" r="4.5" stroke={s} strokeWidth="1.2"/>
      <path d="M6 1.5V10.5M1.5 6H10.5" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M2.5 3.5Q6 5 9.5 3.5M2.5 8.5Q6 7 9.5 8.5" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
    </>);
    case "libraries/websocket": return w(<>
      <path d="M3 4C3 3 4.5 2 6 2C8 2 9.5 3.5 9.5 5.5" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M1.5 2.5L3 4L4.5 2.5" stroke={s} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 8C9 9 7.5 10 6 10C4 10 2.5 8.5 2.5 6.5" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M10.5 9.5L9 8L7.5 9.5" stroke={s} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </>);
    case "libraries/draw": return w(<>
      <path d="M8.5 1.5L10.5 3.5L4 10L1.5 10.5L2 8L8.5 1.5Z" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M7 3L9 5" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
    </>);
    case "libraries/ui": return w(<>
      <rect x="1.5" y="1.5" width="9" height="9" rx="1" stroke={s} strokeWidth="1.2"/>
      <path d="M1.5 4.5H10.5" stroke={s} strokeWidth="1.1"/>
      <path d="M5 4.5V10.5" stroke={s} strokeWidth="1.1"/>
    </>);

    /* ── Userdata ────────────────────────────────────────────── */
    case "userdata/Vector3": return w(<>
      <path d="M6 6L10 3.5M6 6L2 8.5M6 6V11" stroke={s} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M9.5 3.3L10.2 3.5L10 4.2" stroke={s} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.2 9.3L1.8 8.8" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M5.5 10.5L6 11.2L6.5 10.5" stroke={s} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </>);
    case "userdata/Color3": return w(<>
      <path d="M6 1.5L9.5 6.5C9.5 8.7 7.9 10.5 6 10.5C4.1 10.5 2.5 8.7 2.5 6.5L6 1.5Z" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="6" cy="7.5" r="1.3" fill={s} opacity="0.5"/>
    </>);
    case "userdata/Instance": return w(<>
      <circle cx="6" cy="2.5" r="1.5" stroke={s} strokeWidth="1.2"/>
      <line x1="6" y1="4" x2="6" y2="5.5" stroke={s} strokeWidth="1.1"/>
      <line x1="3" y1="5.5" x2="9" y2="5.5" stroke={s} strokeWidth="1.1"/>
      <line x1="3" y1="5.5" x2="3" y2="7" stroke={s} strokeWidth="1.1"/>
      <line x1="9" y1="5.5" x2="9" y2="7" stroke={s} strokeWidth="1.1"/>
      <circle cx="3" cy="8.5" r="1.5" stroke={s} strokeWidth="1.2"/>
      <circle cx="9" cy="8.5" r="1.5" stroke={s} strokeWidth="1.2"/>
    </>);
    case "userdata/Part": return w(<>
      <path d="M6 1.5L10.5 4v4L6 10.5L1.5 8V4L6 1.5Z" stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M6 1.5v9M1.5 4l4.5 2.5 4.5-2.5" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
    </>);
    case "userdata/Player": return w(<>
      <circle cx="6" cy="3.5" r="2" stroke={s} strokeWidth="1.2"/>
      <path d="M2 10.5C2 8.2 3.8 7 6 7C8.2 7 10 8.2 10 10.5" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
    </>);

    /* ── Tools ──────────────────────────────────────────────── */
    case "tools/agent": return w(<>
      <rect x="2.5" y="3.5" width="7" height="6" rx="1.5" stroke={s} strokeWidth="1.2"/>
      <circle cx="4.5" cy="6.5" r="0.8" fill={s}/>
      <circle cx="7.5" cy="6.5" r="0.8" fill={s}/>
      <path d="M4.5 8.5H7.5" stroke={s} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M6 3.5V2M4.5 2H7.5" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
    </>);

    default: return w(
      <circle cx="6" cy="6" r="2" stroke={s} strokeWidth="1.2"/>
    );
  }
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
