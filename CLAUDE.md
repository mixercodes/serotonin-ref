# serotonin-ref

Next.js 14 (App Router) docs site and hosted MCP server for the Serotonin Lua scripting API.

Deployed to Vercel at `https://serotonin-ref.vercel.app`. The `master` branch auto-deploys; `dev` does not.

## Structure

```
src/
  app/
    api/mcp/route.ts      — MCP HTTP endpoint (stateless, JSON-RPC)
    docs/[...slug]/page.tsx — server component, renders one doc page
    globals.css           — CSS custom properties for theming, prose styles
    layout.tsx            — root layout: Sidebar + TopNav + Search
  components/
    MarkdownContent.tsx   — client component: renders markdown, handles search scroll/highlight
    Search.tsx            — client component: Ctrl+K modal, per-heading index
    Sidebar.tsx
    TopNav.tsx
    ThemeSelector.tsx
  content/                — markdown source files (one per page)
    libraries/*.md
    userdata/*.md
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

## Theming

Four themes: `default` (greyscale), `gruvbox`, `nord`, `catppuccin`. All colors are CSS custom properties (`--accent`, `--bg-base`, etc.) set on `[data-theme="..."]` in `globals.css`. Theme is persisted in `localStorage` and applied before first paint via an inline script in `layout.tsx` to avoid flash.

Never hardcode colors — always use CSS variables so new themes work automatically.

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

- `master` deploys to Vercel — only merge here when ready to ship
- `dev` is the working branch — CLAUDE.md lives here only
- No `Co-Authored-By` lines in commits
