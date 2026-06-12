# Agent

Connect an AI assistant to a live Serotonin session. The agent lets Claude (or any MCP client) walk the Roblox DataModel, read entity state, run Lua expressions, and query memory — grounding every script it writes in the actual running game.

| | |
|---|---|
| **Location** | `C:\Serotonin\mcp-serotonin-v2` |
| **Server** | Node.js (TypeScript → `dist/`) |
| **Transport** | MCP over stdio |
| **IPC** | File-based — `C:\Serotonin\files\agent\` |
| **Lua side** | `lua/agent.lua` — load in Serotonin's Scripting tab |

## Architecture

```
MCP client  ←stdio→  Node.js server  ←files→  agent.lua  ←cheat→  Roblox
(Claude)             (dist/index.js)           (Serotonin            (game)
                                               Scripting tab)
```

The Node server writes a command to `agent/cmd.lua`. The Lua agent reads it every `onUpdate` tick, executes it, and writes the result to `agent/result.json`. Node polls for the result and returns it to the MCP client. No ports, no sockets — just files.

The agent draws a live status indicator in the bottom-right corner of the screen: `Agent: idle` (gray), `Agent: busy` (yellow), or `Agent: dumping X/Y` (yellow) during workspace dumps.

## Setup

```bash
cd C:\Serotonin\mcp-serotonin-v2
npm install
npm run build
```

In Serotonin → Scripting tab → Load `lua/agent.lua`.

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "serotonin": {
      "command": "node",
      "args": ["C:/Serotonin/mcp-serotonin-v2/dist/index.js"]
    }
  }
}
```

Call `ping` to verify the connection before any other tool.

---

## Tools

### `ping`

Check if `agent.lua` is loaded and responding. Call this first before any session.

---

### `eval`

```
code: string   — Lua expression; use return to return a value
```

Run a lightweight Lua expression and get the result back as JSON. **Use for simple lookups only** — not for heavy recursive work. Use dump tools for tree traversal.

```lua
return game.PlaceId
return entity.GetPlayers(true)[1].Name
return cheat.GetWindowSize()
```

> [!WARNING]
> **Large numbers lose precision in eval results.** Results are serialized through JSON with limited float precision — instance `.Address` values (~2⁴¹) come back rounded, and two *different* instances can serialize to the **same** rounded address (runtime-verified: two distinct Decals both returned `2375470070000`). Never round-trip addresses or other large integers through eval output: do all `Address`-based work inside a single eval and return only small derived values (counts, offsets, short strings, booleans).

---

### `players`

```
enemies_only?: bool   — default false
```

Player list with live `HumanoidRootPart` positions fetched via `entity:GetBonePosition()`. Includes the local player (`is_local: true`). Returns `[{Name, Position: [x,y,z], is_local?}]`.

---

### `get_bones`

```
player_name: string   — exact Name as shown in players list
```

All bone positions for one player with screen projections. Auto-detects R15 vs R6 rig type by checking for `UpperTorso`. Bones at zero position are filtered out (not present in the rig). Returns `{bone_name: {x,y,z, sx,sy, on_screen}, ...}`.

---

### `screen_info`

Window dimensions, camera world position, mouse position. Call this before writing any ESP or screen-space rendering code. Returns `{width, height, camera: {x,y,z}, mouse: {x,y}}`.

---

### `world_to_screen`

```
x, y, z: number   — world-space position
```

Project a world-space point to screen coordinates via `utility.WorldToScreen`. Returns `{x, y, on_screen}`.

---

### `inspect`

```
path: string   — Lua path, e.g. 'game.Workspace.Football'
```

ClassName, children list, and key properties of one instance. Properties include Position, Size, Health, PrimaryPart name when present.

---

### `inspect_service`

```
name: string   — e.g. 'ReplicatedStorage', 'Players', 'Lighting'
```

Top-level children of a Roblox service. Use before `dump_subtree` to see what a service contains without loading everything.

---

### `dump_workspace`

```
depth?: number   — max tree depth, 2–12, default 6
```

Full async Workspace tree dump. Runs chunked across frames — safe for any size game. Takes up to ~60s for large games; timeout is 120s. Returns the dump file path when done. Use `read_dump` or `grep_dump` to search the result.

Dump files land at `C:\Serotonin\files\dumps\place_<id>_<timestamp>.txt`.

---

### `dump_subtree`

```
root: string      — Lua path to subtree root
depth?: number    — max depth, 1–6, default 4
```

Synchronous subtree dump, capped at 500 instances. Faster than a full workspace dump for one service or branch. Use for `ReplicatedStorage`, `StarterPack`, or a specific Model.

The tree uses `├─` / `└─` / `│` box-drawing characters. Inline properties appear after each instance name: Position, Size, Health, attribute values (prefixed `@`). Value children (`IntValue`, `StringValue`, etc.) show their value inline.

---

### `list_dumps`

List all saved dump files, newest first, with sizes and timestamps.

---

### `read_dump`

```
file: string       — filename from list_dumps
offset?: number    — line offset, default 0
limit?: number     — lines to return, 1–1000, default 400
```

Page through a dump file by line offset.

---

### `grep_dump`

```
file: string      — filename from list_dumps
pattern: string   — case-insensitive regex
limit?: number    — max results, 1–500, default 100
```

Regex search across a dump. The fastest way to find an instance name or class without reading the whole file. **Attributes are not in dumps** — if `grep_dump` finds nothing, use `get_attributes`.

---

### `find_by_class`

```
class_name: string   — e.g. 'Part', 'Humanoid', 'RemoteEvent'
root?: string        — Lua path, default 'game.Workspace'
depth?: number       — 1–6, default 4
```

All instances of one ClassName within a root, capped at 100. Faster than a dump when you need one specific type.

---

### `get_attributes`

```
path: string   — Lua path to instance
```

All attributes on one instance. Attributes are invisible to dumps — `grep_dump` cannot find data stored as instance attributes. Use this when looking for player state flags (`IsBlocking`, `IsGuarding`, etc.) that don't appear in dump searches.

Returns `[{name, type, value}]`. In Serotonin's sandbox, boolean attributes may be exposed as numbers — check `type(value)` before comparing.

---

### `get_ui` / `set_ui`

```
tab: string, container: string, label: string
value?: any   — for set_ui only
```

Read or write a Serotonin UI widget value. Useful for checking or toggling script features from the agent without opening the menu.

---

## IPC protocol

Three files in `C:\Serotonin\files\agent\` carry all communication:

| File | Written by | Deleted by | Purpose |
|---|---|---|---|
| `cmd.lua` | Node | Agent (immediately after read) | Command |
| `result.json` | Agent | Node (after read) | Result |
| `status.json` | Agent | Never (overwritten) | Async progress |

**Command** (written to `cmd.lua`):
```lua
return {
  id      = "a1b2c3d4",
  type    = "eval",
  payload = { code = "return game.PlaceId" }
}
```

**Result** (`result.json`):
```json
{ "id": "a1b2c3d4", "ok": true, "value": 12345, "elapsed": 5 }
```

Node polls at **100ms** for sync commands, **500ms** for async dumps. Timeouts: **10s** for all sync tools, **120s** for `dump_workspace`. Stale IPC files from a previous session are cleaned up automatically on server startup.

---

## Investigation workflow

| Looking for… | Do this |
|---|---|
| **Player state flags** (IsBlocking, IsGuarding, etc.) | `get_attributes` on the character (`game.Workspace:FindFirstChild(name)`) and on the Humanoid. Also check the Player object via `inspect_service "Players"` |
| **Local player's state flags** | `get_attributes path="game.Workspace:FindFirstChild(entity.GetLocalPlayer().Name)"` |
| **Instance names / tree structure** in Workspace | `dump_workspace` → `grep_dump` with a keyword |
| **Contents of a service** (ReplicatedStorage, etc.) | `dump_subtree` on that service → `grep_dump`. Never use recursive `eval` to scan a service |
| **Properties of one known instance** | `inspect` with full Lua path |
| **Top-level children of a service** | `inspect_service` |
| **All instances of one class** | `find_by_class` — faster than a dump for one ClassName |
| **Whether a player holds an item** | `eval` → `char:FindFirstChildOfClass("Tool")` — tools are children of the character when held |
| **Bone positions / ESP data** | `get_bones` — auto-detects rig type |
| **Screen dimensions or camera position** | `screen_info` |

### Standard pre-script workflow

```
1. players             → confirm player names and positions
2. dump_workspace      → get full Workspace structure
3. grep_dump           → find game-specific objects (goals, flags, balls)
4. inspect             → read live properties on relevant instances
5. get_attributes      → check per-player state flags if needed
6. Write Lua using confirmed instance names and paths
```

### Rig detection in Lua

```lua
local char   = game.Workspace:FindFirstChild(p.Name)
local is_r15 = char and char:FindFirstChild("UpperTorso") ~= nil
local torso  = is_r15 and "UpperTorso" or "Torso"
```

---

## Extending the agent

Adding a new tool takes two changes.

**`src/index.ts`** — register the tool:
```typescript
server.tool(
  "my_tool",
  "What it does.",
  { param: z.string().describe("...") },
  async ({ param }) => {
    const r = await call("my_type", { param }, TIMEOUT_SYNC);
    if (!r.ok) return text(`Error: ${r.error}`);
    return text(JSON.stringify(r.value, null, 2));
  }
);
```

**`lua/agent.lua`** — handle the command type inside `dispatch()`:
```lua
elseif cmd.type == "my_type" then
    local result = some_lua_call(cmd.payload.param)
    return { ok = true, value = result }
```

For simple one-liner Lua, skip the agent.lua step and call `eval` directly from the tool handler in `src/index.ts`.

After editing `src/`:
```bash
npm run build
```

After editing `agent.lua`: reload it in Serotonin's Scripting tab. No server restart needed.

## Executing scripts through eval

`cheat.register` raises *"Cannot register callback outside of a script's main execution block."* when called from `eval`/`loadstring` contexts — even directly, outside any `pcall`. To run a callback-driven script through the agent, stub-capture the registrations and drive them manually:

```lua
local src = file.read("C:/Serotonin/scripts/myscript.lua")
local cbs = {}
local orig = cheat.register
cheat.register = function(ev, fn) cbs[ev] = fn end
local f, err = loadstring(src)
if not f then cheat.register = orig; return err end
f()
cheat.register = orig
_TESTCBS = cbs                      -- bare global: persists across eval chunks (_G is nil)
for i = 1, 40 do cbs.onUpdate() end -- drive the captured callback manually
```

Two things make this workable:

- **Bare globals persist across eval chunks** — stash captured callbacks in one and keep driving them from later evals.
- **There is no `cheat.Unregister`** — really-registered callbacks can never be removed. Scripts that may be re-run should use a generation guard so a new load supersedes the old one:

```lua
_MYSCRIPT_GEN = (_MYSCRIPT_GEN or 0) + 1
local MY_GEN = _MYSCRIPT_GEN
cheat.register("onUpdate", function()
    if _MYSCRIPT_GEN ~= MY_GEN then return end  -- superseded: no-op forever
    -- ...
end)
```

> [!WARNING]
> Running a guard-aware script through eval bumps its generation global — any previously loaded real instance deactivates and stays dead until the script is reloaded from the Scripting tab. Instances loaded before the guard existed keep running until Roblox restarts.
