import Link from "next/link";
import { pagesBySection } from "@/lib/pages";

export default function Home() {
  const { library, foundation, tool, userdata } = pagesBySection();

  return (
    <main className="flex-1 overflow-y-auto min-h-0">
      {/* Hero */}
      <section className="relative border-b border-bg-border overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 20% 50%, color-mix(in srgb, var(--accent) 6%, transparent), transparent)" }}
        />

        <div className="relative px-10 py-16 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="4" fill="white" opacity="0.9" />
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.4" opacity="0.35" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-[--text-heading]">
              serotonin
            </span>
            <span className="text-xs font-mono bg-bg-elevated px-1.5 py-0.5 rounded border border-bg-border text-[--text-muted]">
              API Reference
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-4 leading-tight text-[--text-heading]">
            Lua API Reference
          </h1>
          <p className="max-w-xl mb-2 text-[--text-muted]">
            Docs for the Serotonin scripting runtime.{" "}
            <span className="text-[--text]">{library.length} libraries</span>,{" "}
            <span className="text-[--text]">{userdata.length} userdata types</span>,
            and runtime-verified behaviour — all in one place.
          </p>
          <p className="text-sm mb-8 text-[--text-muted]">
            Also available as an{" "}
            <span className="font-medium text-[--accent-light]">MCP server</span> —
            add the URL to your MCP config and let AI assistants query it directly.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/docs/quick-start"
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-opacity hover:opacity-80 bg-[--accent]"
            >
              Get started
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/docs/libraries/utility"
              className="inline-flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-bg-border text-[--text] rounded-lg text-sm font-medium transition-colors border border-bg-border"
            >
              Browse libraries
            </Link>
          </div>
        </div>
      </section>

      {/* MCP config card */}
      <section className="px-10 py-8 border-b border-bg-border">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4 text-[--text-muted]">
          MCP Server
        </h2>
        <div className="bg-bg-surface border border-bg-border rounded-xl p-5 max-w-2xl">
          <p className="text-sm mb-4 text-[--text-muted]">
            Add a single URL to your{" "}
            <code className="text-xs bg-bg-elevated px-1 py-0.5 rounded text-[--accent-light]">.mcp.json</code>{" "}
            and every tool is available with no local install.
          </p>
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1.5 text-[--text-muted]">
              .mcp.json
            </div>
            <pre className="bg-bg-base border border-bg-border rounded-lg p-4 text-xs font-mono overflow-x-auto text-[--text]">
              <code>{`{
  "mcpServers": {
    "serotonin-ref": {
      "type": "http",
      "url": "https://serotonin-ref.vercel.app/api/mcp"
    }
  }
}`}</code>
            </pre>
          </div>
          <p className="text-xs mt-3 text-[--text-muted]">
            Tools:{" "}
            <code className="text-[--text]">list_pages</code>,{" "}
            <code className="text-[--text]">read_page</code>,{" "}
            <code className="text-[--text]">search_pages</code>,{" "}
            <code className="text-[--text]">get_function</code>
          </p>
        </div>
      </section>

      {/* Quick links */}
      <section className="px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 text-[--text-muted]">
              Runtime
            </h2>
            <ul className="space-y-1">
              {foundation.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/docs/${p.slug}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[--text-muted] hover:text-[--text] hover:bg-bg-surface transition-all"
                  >
                    <span className="text-[10px] text-[--accent]">◆</span>
                    <span className="font-mono">{p.title}</span>
                  </Link>
                </li>
              ))}
              {tool.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/docs/${p.slug}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[--text-muted] hover:text-[--text] hover:bg-bg-surface transition-all"
                  >
                    <span className="text-[9px] font-mono shrink-0 text-[--text-muted]">⚙</span>
                    <span className="font-mono">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 text-[--text-muted]">
              Libraries
            </h2>
            <ul className="space-y-1 columns-2">
              {library.map((p) => (
                <li key={p.slug} className="break-inside-avoid">
                  <Link
                    href={`/docs/${p.slug}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[--text-muted] hover:text-[--text] hover:bg-bg-surface transition-all"
                  >
                    <span className="text-[9px] font-mono shrink-0 text-[--text-muted]">lib</span>
                    <span className="font-mono">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
