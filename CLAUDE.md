# serotonin-ref

Next.js 14 (App Router) docs site and hosted MCP server for the Serotonin Lua scripting API.

Deployed to Vercel at `https://serotonin-ref.vercel.app`. The `master` branch auto-deploys; `dev` does not.

## Structure

```
src/
  app/
    api/mcp/route.ts      — MCP HTTP endpoint (stateless, JSON-RPC)
    docs/[...slug]/page.tsx — server component, renders one doc page (wide, prev/next cards)
    page.tsx              — client home: animated hero + MCP card + quick links
    globals.css           — CSS custom properties (single scheme), prose styles, motion utils
    layout.tsx            — root layout: Sidebar + Breadcrumbs + PageTransition + Search
  components/
    MarkdownContent.tsx   — client: renders markdown; code-copy blocks, heading anchors, search highlight
    Search.tsx            — client component: Ctrl+K modal, per-heading index
    Sidebar.tsx           — compact nav; folds in search trigger, build label, footer links, mobile drawer
    Breadcrumbs.tsx       — floating top-right breadcrumb trail (Framer Motion)
    PageTransition.tsx    — Framer Motion route-change fade/slide, keyed on pathname
    BrandMark.tsx         — brain logo (serotonin.win motif) in theme gradient; used by sidebar + home
    DocBadges.tsx         — rbxcli-style title badge row (section / usage / count / runtime-verified)
  lib/
    rehype-callouts.ts    — GitHub-style [!NOTE]/[!TIP]/[!WARNING]/[!CAUTION] admonitions
  content/                — markdown source files (one per page)
    libraries/*.md
    userdata/*.md
    roblox/*.md           — engine-internals domain knowledge (shapes, meshes, decals, rigs, hidden properties)
    tools/*.md
    quick-start.md  pitfalls.md  audit-notes.md  mcp-ai-setup.md
  lib/
    pages.ts              — PAGES array: single source of truth for all slugs/titles/sections
    fetcher.ts            — synchronous fs.readFileSync wrapper
    search-data.ts        — builds per-heading search index at build time
    mcp-tools.ts          — implementation of all MCP tool handlers
```

## Adding a page

1. Add an entry to `PAGES` in `src/lib/pages.ts`
2. Create `src/content/<slug>.md`

That's it — search index, sidebar, prev/next, and MCP `list_pages` all derive from `PAGES`.

## Doc formatting (markdown authoring)

- **Callouts:** start a blockquote with `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, or `[!CAUTION]` on the first line. `rehype-callouts.ts` strips the marker and applies a colored, labeled box. Unmarked blockquotes still render as a clean default callout. Convention: `[!CAUTION]` = crashes / state corruption, `[!WARNING]` = silent-failure gotchas, `[!NOTE]` = indexing/semantics notes.
- **Code blocks** auto-get a language label + copy button (from the ```` ```lua ```` fence).
- **Title badge row** (`DocBadges`) is derived from `PAGES` section + a `^## \`name\`` heading count — no per-page config.
- **No numeric memory offsets in content.** Offsets shift every Roblox engine update; docs reference the `version-*.json` class/property keys (e.g. BasePart → `Shape`) and link to `roblox/hidden-properties` for the parsing pattern. Same for build hashes — never cite a specific build.
- **Roblox pages end with an "Official references" section** linking the authoritative create.roblox.com / devforum pages for the topic.

## Theming & motion

Single curated scheme — **GitHub dark**: `#0d1117` canvas, blue primary (`--accent` `#58a6ff`), cyan secondary (`--accent-2` `#39c5cf`), no purple. Green/amber/red are reserved for semantic callouts only. All colors are CSS custom properties set on `:root` / `[data-theme="default"]` in `globals.css`. The old multi-theme switcher was removed; `data-theme="default"` is hardcoded on `<html>`.

Never hardcode colors — always use CSS variables (`--accent`, `--bg-base`, `--text`, …).

Animation is **Framer Motion** plus a few CSS keyframes in `globals.css` (`float-in`, `pulse-dot`/`.live-dot`, `shimmer`, `.gradient-text`, `.grid-texture`, `.ambient-glow`). Route transitions live in `PageTransition.tsx`; the sidebar active pill uses a shared `layoutId="sidebar-active"`. Any component using `motion.*` must be a client component.

## Search

The search index (`src/lib/search-data.ts`) is built at server startup. It indexes **per heading** (one entry per `##`/`###` in each markdown file), not per page. Each entry carries an `anchor` field (slugified heading text, matching what `rehype-slug` generates).

When a result is clicked:
- `Search.tsx` stores the query in `sessionStorage` and navigates with `router.push('/docs/slug#anchor', { scroll: false })`
- `MarkdownContent.tsx` reads the hash + query on mount, walks text nodes with `TreeWalker`, wraps matches in `<mark class="search-term-highlight">`, then scrolls to the first mark

## MCP server

Endpoint: `POST /api/mcp` — stateless, one server instance per request.

Tools and what they're for:

| Tool | Use when |
|---|---|
| `list_pages` | Need the full page inventory |
| `list_functions` | Exploring what a library offers before looking anything up |
| `lookup` | Writing code and need one function by dotted name (`utility.GetTickCount`) |
| `get_function` | Same as lookup but with separate `library`/`name` params |
| `search_pages` | Don't know which page a concept lives on |
| `read_page` | Need the full markdown for a page |

**Preferred workflow for writing scripts:** `list_functions` → `lookup` → `eval` (in the runtime MCP). Avoid `read_page` unless you need the full prose — it's much larger than a `lookup` result.

`resolveSlug` in `mcp-tools.ts` handles bare names (`draw`, `Vector3`) and full slugs (`libraries/draw`) — all tool handlers go through it.

## Git

- `master` is the only branch — deploys to Vercel on push
- No `Co-Authored-By` lines in commits
