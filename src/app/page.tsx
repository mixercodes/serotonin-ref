"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { pagesBySection } from "@/lib/pages";
import PageIcon from "@/components/PageIcon";
import BrandMark from "@/components/BrandMark";

const MCP_JSON = `{
  "mcpServers": {
    "serotonin-ref": {
      "type": "http",
      "url": "https://serotonin-ref.vercel.app/api/mcp"
    }
  }
}`;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md border border-bg-border bg-bg-elevated px-2 py-1 text-[10px] font-mono text-[--text-muted] hover:text-[--text] hover:border-[--accent] transition-colors"
    >
      {copied ? (
        <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9 10 3" stroke="var(--accent-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>copied</>
      ) : (
        <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="3" y="3" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 7.5V2.5a1 1 0 011-1H7" stroke="currentColor" strokeWidth="1.2"/></svg>copy</>
      )}
    </button>
  );
}

export default function Home() {
  const { library, foundation, tool, userdata } = pagesBySection();

  return (
    <main className="relative flex-1 overflow-y-auto min-h-0">
      {/* Hero */}
      <section className="relative border-b border-bg-border overflow-hidden">
        <div className="absolute inset-0 grid-texture opacity-60 pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 60% at 15% 30%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)" }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative px-6 md:px-12 lg:px-16 pt-20 pb-16 max-w-5xl"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-7">
            <BrandMark size={34} radius={10} />
            <span className="text-lg font-bold tracking-tight text-[--text-heading]">serotonin</span>
            <span className="text-[10px] font-mono bg-bg-elevated px-1.5 py-0.5 rounded border border-bg-border text-[--text-muted]">
              API Reference
            </span>
            <span className="ml-1 flex items-center gap-1.5 text-[10px] font-mono text-[--text-muted]">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-[--accent-2]" /> runtime-verified
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold mb-5 leading-[1.05] tracking-tight">
            <span className="gradient-text">Lua API Reference</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="max-w-xl mb-3 text-[15px] leading-relaxed text-[--text-muted]">
            Everything the Serotonin scripting runtime exposes —{" "}
            <span className="text-[--text]">{library.length} libraries</span>,{" "}
            <span className="text-[--text]">{userdata.length} userdata types</span>, and runtime-verified behaviour, all in one place.
          </motion.p>
          <motion.p variants={fadeUp} className="text-sm mb-8 text-[--text-muted]">
            Also a hosted <span className="font-medium text-[--accent-light]">MCP server</span> — add one URL and let AI assistants query it directly.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <Link
              href="/docs/quick-start"
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-2) 70%, var(--accent)))", boxShadow: "0 6px 24px var(--accent-glow)" }}
            >
              Get started
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-x-0.5">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/docs/libraries/utility"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg-elevated hover:bg-bg-border text-[--text] rounded-lg text-sm font-medium transition-colors border border-bg-border"
            >
              Browse libraries
            </Link>
            <a
              href="https://github.com/mixercodes/serotonin-ref"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg-elevated hover:bg-bg-border text-[--text-muted] rounded-lg text-sm font-medium transition-colors border border-bg-border"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* MCP config card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 md:px-12 lg:px-16 py-10 border-b border-bg-border"
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-4 text-[--text-muted]">MCP Server</h2>
        <div className="bg-bg-surface/60 border border-bg-border rounded-2xl p-5 max-w-2xl backdrop-blur-sm">
          <p className="text-sm mb-4 text-[--text-muted]">
            Add a single URL to your{" "}
            <code className="text-xs bg-bg-elevated px-1 py-0.5 rounded text-[--accent-light]">.mcp.json</code>{" "}
            and every tool is available — no local install.
          </p>
          <div className="relative">
            <CopyButton text={MCP_JSON} />
            <pre className="bg-bg-base border border-bg-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-[--text]">
              <code>{MCP_JSON}</code>
            </pre>
          </div>
          <p className="text-xs mt-3 text-[--text-muted]">
            Tools:{" "}
            {["list_pages", "list_functions", "lookup", "get_function", "search_pages", "read_page"].map((t, i) => (
              <span key={t}>
                {i > 0 && ", "}
                <code className="text-[--text]">{t}</code>
              </span>
            ))}
          </p>
        </div>
      </motion.section>

      {/* Quick links */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="px-6 md:px-12 lg:px-16 py-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          <LinkColumn title="Runtime">
            {[...foundation, ...tool].map((p) => <QuickLink key={p.slug} slug={p.slug} title={p.title} accent="var(--accent)" />)}
          </LinkColumn>
          <LinkColumn title="Libraries" twoCol>
            {library.map((p) => <QuickLink key={p.slug} slug={p.slug} title={p.title} accent="var(--text-muted)" />)}
          </LinkColumn>
          <LinkColumn title="Userdata">
            {userdata.map((p) => <QuickLink key={p.slug} slug={p.slug} title={p.title} accent="var(--accent-2)" />)}
          </LinkColumn>
        </div>
      </motion.section>
    </main>
  );
}

function LinkColumn({ title, children, twoCol }: { title: string; children: React.ReactNode; twoCol?: boolean }) {
  return (
    <motion.div variants={fadeUp}>
      <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 text-[--text-muted]">{title}</h2>
      <ul className={`space-y-0.5 ${twoCol ? "sm:columns-2" : ""}`}>{children}</ul>
    </motion.div>
  );
}

function QuickLink({ slug, title, accent }: { slug: string; title: string; accent: string }) {
  return (
    <li className="break-inside-avoid">
      <Link
        href={`/docs/${slug}`}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[--text-muted] hover:text-[--text] hover:bg-bg-surface transition-all hover:translate-x-0.5"
      >
        <span className="shrink-0 transition-transform group-hover:scale-110" style={{ color: accent }}>
          <PageIcon slug={slug} size={12} />
        </span>
        <span className="font-mono text-[13px]">{title}</span>
      </Link>
    </li>
  );
}
