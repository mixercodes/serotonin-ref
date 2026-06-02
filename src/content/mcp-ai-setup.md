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

**Tools:** `list_pages`, `read_page`, `search_pages`, `get_function`

## Typical agent flow

```
1. list_pages → discover all available pages
2. search_pages({ query: "WorldToScreen" }) → locate relevant pages
3. get_function({ library: "utility", name: "WorldToScreen" }) → read one function
4. read_page({ slug: "libraries/draw" }) → read a full library page
```

## Prompt snippet for Serotonin scripting agents

```
You are writing scripts for the Serotonin Lua scripting runtime (Roblox cheat engine).

Key rules:
- LuaJIT 2.0.3 sandbox, Lua 5.1 semantics
- Not in sandbox: _G (doesn't exist — use bare globals), jit, ffi, os, io, debug, buffer, raknet, string.buffer
- cheat.register("onPaint", fn) is required context for ALL draw.* calls
- draw.* alpha is 0..255 integers (NOT 0..1 floats) — passing 1 renders near-invisible
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
