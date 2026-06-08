# Overview

Serotonin scripts run on **LuaJIT 2.0.3** (Lua 5.1 semantics). `jit`, `ffi`, `os`, `io`, `debug`, and `string.buffer` are stripped. Scripts go in `C:\Serotonin\scripts\*.lua` and are loaded from the Scripting tab. Files written by scripts land in `C:\Serotonin\files\`.

## Event model

Scripts register callbacks — there is no `while true` loop. Register with `cheat.register(event, callback)`.

| Event | Fires | Use for |
|---|---|---|
| `onPaint` | Every frame (60–250 Hz) | All `draw.*` calls — required context |
| `onUpdate` | ~10 ms | Game logic, aim, entity queries |
| `onSlowUpdate` | ~1 s | Background checks, logging |
| `shutdown` | On script unload | Cleanup, save state |
| `newPlace` | Place change | Reset cached instance refs |

Both `paint` and `onPaint` dispatch to the same slot — registering both doubles the callback rate.

> [!CAUTION]
> **`cheat.register` cannot be called from inside `pcall`.** Raises `"Cannot register callback outside of a script's main execution block."` Register at the top level of your script only.

## Naming convention

Most library functions exist in three forms: PascalCase (`GetTickCount`), camelCase (`getTickCount`), and snake_case (`get_tick_count`). Single-word verbs collapse to two forms: PascalCase + lowercase (`Read`/`read`).

The `file` library is **lowercase-canonical** — `file.read`, `file.write`, etc. PascalCase variants are not bound.

SCREAMING_SNAKE_CASE is never bound anywhere.

```lua
-- All equivalent:
utility.GetTickCount()
utility.getTickCount()
utility.get_tick_count()
```

## Sandbox globals

**Serotonin:** `ui`, `mouse`, `keyboard`, `http`, `websocket`, `audio`, `memory`, `file`, `entity`, `game`, `cheat`, `draw`, `utility`, `bit` · userdata constructors `Vector3`, `Color3`.

**Standard Lua 5.1** (`_VERSION` is `"Lua 5.1"`) — more is present than you might expect:

| Group | Globals |
|---|---|
| Core | `type`, `tostring`, `tonumber`, `pairs`, `ipairs`, `next`, `select`, `unpack`, `print`, `error`, `assert`, `pcall`, `xpcall` |
| Libraries | `table`, `string`, `math`, `coroutine` (full LuaJIT sets) |
| Metatables / raw | `setmetatable`, `getmetatable`, `rawget`, `rawset`, `rawequal`, `newproxy` |
| Env / loading | `getfenv`, `setfenv`, `load`, `loadstring`, `loadfile`, `dofile`, `require`, `module`, `package` |
| GC | `collectgarbage`, `gcinfo` |

**Not available** (return `nil`, or error when called): `_G`, `_ENV`, `workspace`, `typeof`, `tick`, `time`, `delay`, `spawn`, `wait`, `task`, `Instance`, `CFrame`, `Vector2`, `Enum`, `Region3`, `UDim2`, `TweenInfo`, `Ray`, `Random`, `DateTime`, `Drawing`, `os`, `io`, `debug`, `jit`, `ffi`, `buffer`, `raknet`.

> [!NOTE]
> Coming from a Roblox executor? `Drawing`, `Instance`, `task`, `tick`, and `typeof` are **not** here — use `draw.*` (inside `onPaint`), `cheat.register`, and `utility.GetTickCount` instead.

`coroutine` is fully available: `create`, `wrap`, `resume`, `yield`, `status`, `running`, `isyieldable`. `math`, `string`, and `table` are the full LuaJIT standard sets.

> [!WARNING]
> **`_G` does not exist in the sandbox.** Use bare globals: `_MY_FLAG = true`, not `_G._MY_FLAG = true`.

## Userdata vs table

Library modules (`utility`, `entity`, etc.) are Lua **tables** indexed with `.`. Objects returned by calls (`Vector3`, `Color3`, Roblox instances, player userdatas) are **userdata** — call their methods with `:`.

```lua
local v = Vector3.new(1, 2, 3)
print(v.X, v.Y, v.Z, v.Magnitude)
print(v:Lerp(Vector3.new(10, 0, 0), 0.5))
```

## Services

`game.GetService` takes dot syntax, not colon — `game` is a table proxy, not a Roblox Instance.

```lua
local rs   = game.GetService("ReplicatedStorage")
local http = game.GetService("HttpService")
```

Pre-resolved shortcuts: `game.Workspace`, `game.Players`, `game.LocalPlayer`. Everything else needs `GetService`.

## Bootstrap pattern

```lua
if not _MYSCRIPT_LOADED then
    _MYSCRIPT_LOADED = true

    cheat.register("onPaint", function()
        draw.TextOutlined("hello", 20, 20, Color3.fromRGB(255,255,255), "Verdana", 255)
    end)

    cheat.register("shutdown", function()
        -- cleanup
    end)
end
```
