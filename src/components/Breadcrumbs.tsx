"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PAGES } from "@/lib/pages";

const SECTION_TITLES: Record<string, string> = {
  libraries: "Libraries",
  userdata: "Userdata",
  tools: "Tools",
};

interface Crumb {
  label: string;
  href?: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  // Only docs routes carry a trail.
  if (!pathname.startsWith("/docs/")) return [];
  const slug = pathname.replace(/^\/docs\//, "");
  const segments = slug.split("/").filter(Boolean);

  const crumbs: Crumb[] = [{ label: "docs", href: "/" }];

  if (segments.length === 2) {
    // e.g. libraries / utility  → group + leaf
    const [group, leaf] = segments;
    crumbs.push({ label: SECTION_TITLES[group] ?? group });
    const page = PAGES.find((p) => p.slug === slug);
    crumbs.push({ label: page?.title ?? leaf });
  } else {
    // foundation pages: quick-start, pitfalls, …
    const page = PAGES.find((p) => p.slug === slug);
    crumbs.push({ label: page?.title ?? segments.join("/") });
  }

  return crumbs;
}

function Sep() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[--text-faint] shrink-0">
      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  if (!crumbs.length) return null;

  return (
    <div className="absolute top-0 right-0 left-0 z-20 flex justify-end px-5 md:px-8 lg:px-12 pointer-events-none">
      <motion.nav
        key={pathname}
        aria-label="Breadcrumb"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto mt-3 flex items-center gap-1.5 rounded-full border border-bg-border bg-bg-surface/80 px-3 py-1.5 text-xs backdrop-blur-md shadow-lg shadow-black/20"
      >
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <motion.span
              key={`${c.label}-${i}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i + 0.08, duration: 0.25 }}
              className="flex items-center gap-1.5"
            >
              {i > 0 && <Sep />}
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="font-mono text-[--text-muted] hover:text-[--text] transition-colors"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={
                    last
                      ? "font-mono font-medium text-[--accent-light]"
                      : "font-mono text-[--text-muted]"
                  }
                >
                  {c.label}
                </span>
              )}
            </motion.span>
          );
        })}
      </motion.nav>
    </div>
  );
}
