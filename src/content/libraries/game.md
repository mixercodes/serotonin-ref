# `game`

Entry point to the Roblox DataModel and a small set of cheat-side utilities. The `game` object is a **Lua table proxy** — not a Roblox Instance — so all methods use dot syntax, not colon.

> **Always use dot syntax.** `game.GetService("Players")` works. `game:GetService("Players")` fails with a Lua error because there is no self argument to pass.

## Pre-resolved fields

| Field | Type | Notes |
|---|---|---|
| `game.Workspace` | Roblox `Workspace` | always available |
| `game.Players` | Roblox `Players` service | always available |
| `game.LocalPlayer` | Roblox `Player` | local user — use this, not `GetService("Players").LocalPlayer` which is `nil` in the sandbox |
| `game.CameraPosition` | `Vector3` | live camera world position |
| `game.DataModel` | userdata | the root DataModel instance |
| `game.PlaceID` | `number` | current Roblox place ID |
| `game.Lighting` | `nil` | not pre-resolved — use `game.GetService("Lighting")` |

Other services (`RunService`, `ReplicatedStorage`, etc.) are not pre-resolved. Use `GetService` to fetch them.

---

## `GetService`

```lua
game.GetService(name: string) → userdata | nil
```

Returns the Roblox service whose ClassName is `name`. Returns `nil` for unknown names or non-string arguments. Passing `nil` raises.

Services confirmed to return userdata: `Players`, `Workspace`, `ReplicatedStorage`, `RunService`, `UserInputService`, `TweenService`, `HttpService`, `StarterGui`, `StarterPack`, `Lighting`, `SoundService`, `Teams`, `TeleportService`, `MarketplaceService`.

`ServerStorage` returns `nil` (server-side only).

`Players:GetChildren()` returns Instance userdata with readable `.Name`, `.UserId` (number), `.Team` (string), and `.Character` (Instance). Standard metatable methods (`FindFirstChild`, `GetChildren`, etc.) all work on service instances.

```lua
local rs  = game.GetService("ReplicatedStorage")
local run = game.GetService("RunService")
```

---

## `GetFFlag` / `SetFFlag`

```lua
game.GetFFlag(name: string, type: string) → value | nil
game.SetFFlag(name: string, value, type: string)
```

Read or write a Roblox FFlag. Valid `type` strings: `'int'`, `'bool'`, `'float'`, `'double'`. Returns `nil` for unknown flag names (no error). Any other type string raises.

`SetFFlag` changes live Roblox client behavior. Avoid unless you know what the flag does — restart Roblox to reset.

```lua
local cap = game.GetFFlag("TaskSchedulerTargetFps", "int")
if cap then
    print("FPS cap:", cap)
end
```

---

## `IsFocused`

```lua
game.IsFocused() → bool
```

Returns `true` when the Roblox window currently holds input focus. Use this to gate any input-injection logic (mouse clicks, key presses) so it doesn't fire while Roblox is in the background.

```lua
cheat.register("onUpdate", function()
    if not game.IsFocused() then return end
    -- input logic here
end)
```

---

## `SilentAim`

```lua
game.SilentAim(x: number, y: number)
```

Directs the cheat aim system at screen-space `(x, y)`. Can trigger a shot depending on aim configuration — always gate with a target validity check.

```lua
local tgt = entity.GetTarget()
if tgt and tgt.IsAlive and tgt.IsEnemy then
    local pos = tgt:GetBonePosition("Head")
    if pos then
        local x, y, on = utility.WorldToScreen(pos)
        if on then game.SilentAim(x, y) end
    end
end
```

---

## `PlayerWhitelist`

```lua
game.PlayerWhitelist(name: string)
```

Marks a username as friendly. The player's `IsWhitelisted` field becomes `true` and aim systems skip them. No removal API — whitelisted entries persist for the script lifetime.

```lua
game.PlayerWhitelist("FriendUsername")
```

---

## Patterns

### Walk a service's children

```lua
local rs = game.GetService("ReplicatedStorage")
for _, child in ipairs(rs:GetChildren()) do
    print(child.Name, child.ClassName)
end
```

### Whitelist a list at load

```lua
for _, name in ipairs({"Alice", "Bob"}) do
    game.PlayerWhitelist(name)
end
```

### Live camera position

```lua
cheat.register("onUpdate", function()
    local cam = game.CameraPosition
    if cam then
        print(string.format("cam (%.0f, %.0f, %.0f)", cam.X, cam.Y, cam.Z))
    end
end)
```
