# MCP / AI setup

## Hosted MCP server

Add one URL to your MCP config and every tool is available with no local install:

```json
{
  "mcpServers": {
    "serotonin-ref": {
      "type": "http",
      "url": "https://serotonin-ref.vercel.app/api/mcp"
    }
  }
}
```

**Tools:**

| Tool | Use when |
|---|---|
| `list_pages` | Need the full page inventory |
| `list_functions` | Exploring what a library offers before looking anything up |
| `lookup` | Writing code and need one function by dotted name (`utility.GetTickCount`) |
| `get_function` | Same as `lookup` but with separate `library`/`name` params |
| `search_pages` | Don't know which page a concept lives on |
| `read_page` | Need the full markdown for a page |

## Typical agent flow

```
1. list_functions({ library: "draw" })           → discover what's in a library
2. lookup({ fn: "utility.GetTickCount" })         → read one function by dotted name
3. search_pages({ query: "WorldToScreen" })       → locate a concept across pages
4. read_page({ slug: "libraries/draw" })          → read a full library page
```

Prefer `list_functions` → `lookup` over `read_page` when writing code — lookup results are much smaller.

## Prompt snippet for Serotonin scripting agents

```
You are writing scripts for the Serotonin Lua scripting runtime (Roblox cheat engine).

Key rules:
- LuaJIT 2.0.3 sandbox, Lua 5.1 semantics
- Not in sandbox: _G (doesn't exist — use bare globals), jit, ffi, os, io, debug, buffer, raknet, string.buffer
- cheat.register("onPaint", fn) is required context for ALL draw.* calls
- draw.* alpha is 0..255 integers — passing 1 renders near-invisible
- entity.GetPlayers(false) excludes the local player — use entity.GetLocalPlayer()
- p.IsVisible requires at least one Visible Only check active in Serotonin (ESP, Aimbot, or Triggerbot) — returns false when none are enabled
- GetBonePosition can return nil — guard with: if not b then ... end
- Entity bone cache only covers enemies; use workspace for teammate positions
- ui GetValue/SetValue for dropdown/listbox uses 0-based index (0 = first option)
- ui.NewColorpicker: 4th arg is default {r,g,b,a}, 5th arg is inLine bool
- cheat.register cannot be called inside pcall
- game.GetService uses DOT syntax: game.GetService("Players") not game:GetService(...)
- game.GetService("Players").LocalPlayer is nil — use game.LocalPlayer or entity.GetLocalPlayer()
- audio.PlaySound crashes on non-WAV input — always verify RIFF header first
- cheat.LoadString is broken in current builds — use standard loadstring() instead
- Tab/container IDs must differ from their display labels
- file.read sandbox root is C:\Serotonin\files\ (relative to files/, not scripts/)
- All draw.* calls must be inside onPaint
- No += or -= operators — use x = x + 1
- No continue keyword — use goto label / ::label::
- No type annotations at runtime
```
