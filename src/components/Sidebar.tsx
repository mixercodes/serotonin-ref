"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pagesBySection, type PageSection } from "@/lib/pages";

const SECTION_LABELS: Record<PageSection, string> = {
  foundation: "Runtime",
  library: "Libraries",
  userdata: "Userdata",
  tool: "Tools",
};

const SECTION_ORDER: PageSection[] = ["foundation", "library", "userdata", "tool"];

export default function Sidebar() {
  const pathname = usePathname();
  const bySection = pagesBySection();

  return (
    <aside className="w-60 shrink-0 border-r border-bg-border bg-bg-surface flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-bg-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
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
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {SECTION_ORDER.map((section) => {
          const pages = bySection[section];
          if (!pages.length) return null;
          return (
            <div key={section} className="mb-5">
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[--text-muted]">
                {SECTION_LABELS[section]}
              </div>
              <ul className="space-y-0.5">
                {pages.map((page) => {
                  const href = `/docs/${page.slug}`;
                  const active = pathname === href;
                  return (
                    <li key={page.slug}>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                          active
                            ? "sidebar-item-active font-medium"
                            : "text-[--text-muted] hover:text-[--text] hover:bg-bg-elevated"
                        }`}
                      >
                        {section === "library" && (
                          <span className="text-[10px] font-mono shrink-0 text-[--text-muted]">
                            lib
                          </span>
                        )}
                        {section === "userdata" && (
                          <span className="text-[10px] font-mono shrink-0 text-[--accent-2]">
                            ud
                          </span>
                        )}
                        {section === "tool" && (
                          <span className="text-[10px] font-mono shrink-0 text-[--text-muted]">
                            ⚙
                          </span>
                        )}
                        {section === "foundation" && (
                          <span className="text-[10px] shrink-0 text-[--accent]">
                            ◆
                          </span>
                        )}
                        <span className="font-mono">{page.title}</span>
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
  );
}
