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

## Sandbox
- LuaJIT 2.0.3, Lua 5.1 semantics
- Available: coroutine, math, string, table (full standard sets), bit (LuaJIT bitop), Vector3, Color3
- NOT available: _G (use bare globals directly), CFrame, Vector2, jit, ffi, os, io, debug, buffer, raknet
- No += or -= operators — use x = x + 1
- No continue keyword — use goto label / ::label::
- No type annotations at runtime

## Events
- cheat.register("onPaint"|"onUpdate"|"onSlowUpdate"|"shutdown"|"newPlace", fn)
- cheat.register CANNOT be called inside pcall — register at top level only
- ALL draw.* primitives must be called inside onPaint — calling outside crashes with C++ exception

## draw.*
- Alpha is 0..255 integer — passing 1 renders near-invisible; use 255 for fully opaque
- draw.Text / draw.TextOutlined: exactly 5 args (text, x, y, Color3, alpha) — a size arg crashes even inside onPaint
- draw.Gradient: exactly 7 args — 8th arg crashes
- draw.Polyline: crashes with an empty point table
- Safe outside onPaint: GetTextSize, GetScreenSize, GetPartCorners, ComputeConvexHull

## entity
- entity.GetPlayers(false) excludes the local player — use entity.GetLocalPlayer()
- GetBonePosition can return nil — always guard: if not b then ... end
- Entity bone cache only covers enemies — teammates return zero-vector bones and empty BoundingBox ({})
- p.BoundingBox is empty table {} for teammates and dead players — check bb.w before using
- p.IsVisible requires at least one Visible Only check active in Serotonin — returns false otherwise

## game
- game is a Lua table proxy — use DOT syntax: game.GetService("Players") not game:GetService(...)
- game.GetService("Players").LocalPlayer is nil — use game.LocalPlayer or entity.GetLocalPlayer()
- game.IsFocused() — bool, true when Roblox window has input focus

## memory
- memory.Read(type, addr) / memory.Write(type, addr, value) — type string is FIRST arg
- memory.Scan(pattern) — single-arg form only; range/callback forms crash; absent pattern also crashes

## ui
- GetValue/SetValue for dropdown/listbox uses 0-based index (0 = first option)
- ui.NewColorpicker: 4th arg is default {r,g,b,a}, 5th arg is inLine bool
- Tab/container IDs must differ from their display labels

## misc
- audio.PlaySound crashes on non-WAV input — verify body:sub(1,4) == "RIFF" first
- cheat.LoadString is broken — use standard loadstring() instead
- file.read sandbox root is C:\Serotonin\files\ (relative paths resolve here, not scripts/)
- utility.WorldToScreen returns 3 separate values: x, y, onScreen — not a table
- utility.GetMousePos returns a table {[1]=x, [2]=y} — access as mp[1], mp[2]
```
