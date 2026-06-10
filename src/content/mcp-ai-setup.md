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

## Tools

| Tool | Signature | Use when |
|---|---|---|
| `list_pages` | `()` | Browse the full page inventory — returns slug, title, section for every page |
| `list_functions` | `(library: string)` | Discover what a library exposes before looking anything up — start here |
| `lookup` | `(fn: string)` | Pull one function by dotted name while writing code — e.g. `"draw.Text"`, `"entity.GetPlayers"` |
| `get_function` | `(library: string, name: string)` | Same as `lookup` with separate params — e.g. `library: "draw", name: "Text"` |
| `search_pages` | `(query: string)` | Keyword search when you don't know which page a concept lives on |
| `read_page` | `(slug: string)` | Full markdown for a page — use the slug from `list_pages`, e.g. `"libraries/draw"`, `"pitfalls"` |

**Preferred workflow:** `list_functions` → `lookup`. Avoid `read_page` unless you need full prose — a `lookup` result is an order of magnitude smaller.

## Typical agent flows

### Writing a script that uses a library

```
1. list_functions({ library: "draw" })
   → see everything draw exposes, with one-line descriptions

2. lookup({ fn: "draw.TextOutlined" })
   → exact signature, args, return values, examples

3. lookup({ fn: "utility.WorldToScreen" })
   → confirm return shape before using it
```

### Don't know which library has what you need

```
1. search_pages({ query: "world to screen" })
   → finds the utility page and the relevant heading

2. lookup({ fn: "utility.WorldToScreen" })
   → pull the function directly
```

### Need all examples and prose for a page

```
1. list_pages()
   → find the exact slug (e.g. "libraries/entity", "userdata/Instance")

2. read_page({ slug: "libraries/entity" })
   → full page markdown including patterns and gotchas
```

### Discovering what userdata methods exist

```
1. list_functions({ library: "Instance" })
   → all instance methods (FindFirstChild, GetAttributes, etc.)

2. lookup({ fn: "Instance.GetBonePosition" })   ← wrong library, will error
   lookup({ fn: "Player.GetBonePosition" })      ← correct
```

## Environment note

This reference documents a **standalone sandboxed LuaJIT 2.0.3 environment** with its own bindings — not the official Roblox/Luau API and not Roblox Studio. Snippets run only inside the Serotonin sandbox. Standard Roblox APIs (`game:GetService`, `Instance.new`, `TweenService`, etc.) do not exist here unless explicitly documented.

## Prompt snippet for Serotonin scripting agents

```
You are writing scripts for the Serotonin Lua scripting runtime (Roblox cheat engine).
Use the serotonin-ref MCP to look up every API call before writing it — never guess signatures.
Workflow: list_functions(library) → lookup(fn) for any function you need.

## Sandbox
- LuaJIT 2.0.3, Lua 5.1 semantics
- Available: coroutine, math, string, table (full sets), bit (LuaJIT bitop), Vector3, Color3
- NOT available: _G (use bare globals), CFrame, Vector2, jit, ffi, os, io, debug, buffer, raknet
- No += or -= — use x = x + 1
- No continue — use goto label / ::label::
- No type annotations at runtime

## Events
- cheat.register("onPaint"|"onUpdate"|"onSlowUpdate"|"shutdown"|"newPlace", fn)
- cheat.register CANNOT be called inside pcall — top level only
- ALL draw.* primitives require onPaint context — calling outside crashes (C++ exception)

## draw.*
- Alpha is 0..255 integer — 255 = opaque, 0 = transparent; passing 1 renders near-invisible
- draw.Text / draw.TextOutlined: exactly 5 args (text, x, y, Color3, alpha) — size arg crashes
- draw.Gradient: exactly 7 args — 8th arg crashes
- draw.Polyline: crashes with empty point table
- Safe outside onPaint: GetTextSize (size arg accepted but ignored), GetScreenSize, GetPartCorners, ComputeConvexHull

## entity
- entity.GetPlayers(false) excludes local player — use entity.GetLocalPlayer() for self
- GetBonePosition can return nil — guard: if not b then return end
- Bone cache covers enemies only — teammates return zero-vector bones and empty BoundingBox
- p.BoundingBox is {} for teammates and dead players — check bb and bb.w before use
- p.IsVisible requires a Visible Only check active in Serotonin — false when none enabled
- entity.GetParts() returns numeric addresses, not Instance userdata

## game
- game is a Lua table proxy — DOT syntax only: game.GetService("Players") not game:GetService(...)
- game.GetService("Players").LocalPlayer is nil — use game.LocalPlayer or entity.GetLocalPlayer()
- game.IsFocused() → bool, true when Roblox window has input focus
- game.PlaceID → numeric place ID (game name string is not accessible in the sandbox)

## Instance properties
- All casings work: instance.Position, instance.position, instance.POSITION
- CFrame is blocked — raises "property 'CFrame' does not exist"
- IsA supports class hierarchy: part:IsA("BasePart") = true for MeshPart

## memory
- memory.Read(type, addr) / memory.Write(type, addr, value) — type string is FIRST arg
- memory.Scan(pattern) — single-arg only; range/callback forms crash; absent pattern also crashes

## ui
- GetValue/SetValue for dropdown/listbox: 0-based index (0 = first option)
- ui.NewColorpicker: 4th arg = default {r,g,b,a}, 5th arg = inLine bool
- Tab and container IDs must differ from their display labels

## misc
- audio.Beep(freq, duration, volume?) — volume unconstrained, 0..1 assumed
- audio.PlaySound crashes on non-WAV — verify body:sub(1,4) == "RIFF" first
- cheat.LoadString is broken — use standard loadstring() instead
- file paths: relative paths root at C:\Serotonin\files\ (not scripts/)
- utility.WorldToScreen → x, y, onScreen (3 separate values, not a table)
- utility.GetMousePos → table {[1]=x, [2]=y} — access as mp[1], mp[2]
- websocket.Connect returns a numeric connection ID (sequential from 1)
- http is HTTPS only — plain HTTP untested; callback fires on later tick, never synchronously
```

## Pairing with official Roblox docs

This reference covers the Serotonin runtime and the engine internals it interacts with — it does not duplicate Roblox's own API documentation. For engine-level questions outside these pages, point your assistant at:

- **[create.roblox.com/docs](https://create.roblox.com/docs)** — the official creator documentation (classes, enums, datatypes). Directly fetchable by AI assistants; enum pages carry exact numeric values.
- **[Roblox/creator-docs](https://github.com/Roblox/creator-docs)** — the same content as raw YAML/markdown on GitHub, convenient for programmatic lookup.
- **[devforum.roblox.com](https://devforum.roblox.com)** — release notes and behavior announcements (the Roblox pages here cite the relevant threads inline).

There is no official Roblox documentation MCP server; the pages in the **Roblox** section embed the authoritative links per topic instead, so `read_page` results carry them to the assistant.
