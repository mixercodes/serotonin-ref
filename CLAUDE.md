# CLAUDE.md — serotonin-ref dev notes

## What this project is

Next.js 14 (App Router) + Tailwind CSS docs site for the Serotonin Lua scripting runtime.
Deployed to Vercel. Repo: https://github.com/mixercodes/serotonin-ref

## Stack

- Next.js 14 App Router, TypeScript, Tailwind CSS v3
- `@tailwindcss/typography` for prose
- `react-markdown` + `rehype-highlight` + `remark-gfm` for markdown rendering
- `@modelcontextprotocol/sdk` for the `/api/mcp` endpoint
- `highlight.js` (github-dark-dimmed theme)

## Key paths

```
src/
  app/
    layout.tsx          root layout — Sidebar + TopNav, theme init script
    page.tsx            landing page
    globals.css         CSS variables for all 4 themes + prose/sidebar overrides
    docs/[...slug]/     dynamic docs pages (SSG via generateStaticParams)
    api/mcp/route.ts    Streamable HTTP MCP endpoint (stateless)
  components/
    Sidebar.tsx         client component, uses usePathname for active state
    TopNav.tsx          includes ThemeSelector
    ThemeSelector.tsx   4 theme dots (default/gruvbox/nord/catppuccin)
    MarkdownContent.tsx react-markdown wrapper
  lib/
    pages.ts            PAGES list — single source of truth for nav + MCP
    fetcher.ts          reads from src/content/ via fs.readFileSync
    mcp-tools.ts        list_pages, read_page, search_pages, get_function
  content/              static markdown docs (edit these to update content)
    libraries/          one .md per library
    userdata/           Vector3, Color3, Instance, Part, Player
    tools/agent.md      agent (mcp-serotonin-v2) documentation
    quick-start.md, pitfalls.md, audit-notes.md, mcp-ai-setup.md
tailwind.config.ts      colors reference CSS vars (var(--bg-base) etc)
```

## Themes

4 themes via CSS custom properties on `[data-theme]` attribute on `<html>`.
Defined in `src/app/globals.css`. Tailwind color tokens (`bg-bg-base`, `text-accent`, etc.) all reference `var(--...)`.

Theme IDs: `default` | `gruvbox` | `nord` | `catppuccin`

To add a theme: add a `[data-theme="name"]` block in globals.css + add entry to `ThemeSelector.tsx`.

## Content

Docs live in `src/content/`. Edit the `.md` files directly — no build step needed, they're read at request time via `fs.readFileSync`.

Adding a page:
1. Create `src/content/<section>/<slug>.md`
2. Add entry to `PAGES` array in `src/lib/pages.ts`

## MCP endpoint

`/api/mcp` — Streamable HTTP, stateless. Each request creates a fresh `Server` + `WebStandardStreamableHTTPServerTransport` pair.
Tools: `list_pages`, `read_page`, `search_pages`, `get_function`.
Content served from local `src/content/` files — no GitHub fetches at runtime.

Claude config:
```json
{
  "mcpServers": {
    "serotonin-docs": {
      "type": "http",
      "url": "https://serotonin-ref.vercel.app/api/mcp"
    }
  }
}
```

## Dev server

```bash
npm run dev      # http://localhost:3000
npm run build    # production build check
```

CSS is compiled lazily in dev — the first real browser page visit triggers it. The page looks white until that first visit warms up the CSS.

## Content rules

- Write facts about the current runtime. No hedging language.
- No references to other docs sites or audits.
- Alpha for all `draw.*` calls: **0–255 integer** (not 0..1).
- `entity.GetPlayers(false)` excludes the local player.
- `p.IsVisible` requires a Visible Only check active in Serotonin — returns false when none are enabled.
- `GetBonePosition` can return nil — always guard.
- UI dropdown/listbox indices are **0-based**.
- `cheat.register` cannot be inside `pcall`.
- `_G` does not exist — use bare globals.
- `game.GetService("Players").LocalPlayer` is nil — use `game.LocalPlayer`.

## Verified runtime gotchas (from C:\Serotonin\scripts\CLAUDE.md)

Full details live in the scripts CLAUDE.md. Key overrides for the docs:
- `draw.*` alpha is `0..255` (NOT 0..1)
- `entity.GetPlayers(false)` excludes local player; use `entity.GetLocalPlayer()`
- `p.IsVisible` requires a Visible Only check active (ESP, Aimbot, or Triggerbot) — returns false when none are enabled
- `GetBonePosition` can return nil (guard before `.X` access)
- Entity cache covers enemies only; teammates need workspace fallback
- UI dropdown `GetValue` / `SetValue` / default arg are all 0-based
- `ui.NewColorpicker(tab, con, label, {r,g,b,a}, inLine)` — 5 args
- Tab/container IDs must differ from their display labels
- `cheat.register` errors inside `pcall`
- `_G` is nil in sandbox
- `HumanoidRootPart.CFrame` returns nil for non-local players

## Git

Single clean commit preferred. Amend + force push rather than stacking fixes.
No Claude attribution in commit messages.
