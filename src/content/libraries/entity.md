# `entity`

The cheat's player cache. Rather than walking `game.Players` yourself on every frame, `entity` gives you pre-fetched snapshots that the runtime keeps fresh. Use it for all performance-sensitive reads — ESP, aimbot, triggerbot.

| | |
|---|---|
| **Core queries** | `GetPlayers`, `GetLocalPlayer`, `GetTarget` |
| **Part cache** | `GetParts`, `GetPartsCount` |
| **Custom entities** | `AddModel`, `EditModel`, `RemoveModel`, `ClearModels` |

## Player userdata fields

Every value returned by `GetPlayers`, `GetLocalPlayer`, and `GetTarget` is a player userdata with these read-only fields:

| Field | Type | Notes |
|---|---|---|
| `Name` | `string` | Roblox username |
| `DisplayName` | `string` | display name set by the user |
| `UserId` | `number` | persistent Roblox user ID |
| `Team` | `string` | team name as a string, not an Instance |
| `TeamColor` | `userdata` | `.R`, `.G`, `.B` give byte values `0..255` — use with `Color3.fromRGB(tc.R, tc.G, tc.B)` |
| `Weapon` | `string` | held weapon identifier, empty when none |
| `Position` | `Vector3` | **frequently `(0,0,0)` in FFA-style games** — use bone accessors instead |
| `Velocity` | `Vector3` | normalized walk direction, not raw physics velocity |
| `Health` | `number` | current HP |
| `MaxHealth` | `number` | max HP |
| `IsAlive` | `bool` | whether the player is alive and spawned |
| `IsEnemy` | `bool` | `true` if on the opposing team |
| `IsVisible` | `bool` | `true` when not occluded. **Requires at least one Visible Only check active** in Serotonin (ESP, Aimbot, or Triggerbot) — returns `false` when none are enabled |
| `IsWhitelisted` | `bool` | `true` if added via `game.PlayerWhitelist` |
| `BoundingBox` | `table {x, y, w, h}` | screen-space pixel rectangle; **empty table `{}`** for teammates and dead players — always check `bb.w` exists before using |

> [!WARNING]
> **`Position` is stale.** In FFA and many competitive modes, `p.Position` stays at `(0,0,0)` for all living players. Use `p:GetBonePosition("HumanoidRootPart")` for live world position.

> [!WARNING]
> **`IsVisible` requires a Visible Only check to be active.** With no Visible Only checks enabled in Serotonin (ESP, Aimbot, or Triggerbot), the field returns `false` for all players — wall checking is skipped as a performance optimization. Enable at least one for valid results.

## Bone accessors

| Method | Returns |
|---|---|
| `:GetBonePosition(name)` | `Vector3 \| nil` |
| `:GetBoneSize(name)` | `Vector3` |
| `:GetBoneRotation(name)` | flat 3×3 rotation matrix as 9 numbers |
| `:GetBoneInstance(name)` | the underlying Roblox `Instance` |

Bone names follow standard R15 convention: `HumanoidRootPart`, `Head`, `UpperTorso`, `LowerTorso`, `LeftUpperArm`, `RightUpperArm`, `LeftUpperLeg`, `RightUpperLeg`, etc. R6 uses `Torso`, `Left Arm`, etc.

> [!WARNING]
> **`GetBonePosition` can return `nil`.** Despite documentation stating it returns `Vector3(0,0,0)` for missing bones, it returns `nil` in production. Always guard: `local b = p:GetBonePosition(name); if not b then ... end`. A separate zero-vector check is still needed for bones that exist but have no valid position.

> [!WARNING]
> **Entity cache only covers enemies.** `p:GetBonePosition()` and `p.BoundingBox` return zero/empty for teammates even when they are alive. For teammate positions, fall back to workspace: `game.Workspace:FindFirstChild(p.Name):FindFirstChild("HumanoidRootPart").Position`.

---

## `GetPlayers`

```lua
entity.GetPlayers([onlyEnemies: bool]) → table
```

Returns an array of player userdatas. Pass `true` to filter to enemies only. Pass `false` (or omit) for all tracked players — **note: this excludes the local player**. Use `GetLocalPlayer()` to get yourself.

```lua
local enemies = entity.GetPlayers(true)
for _, p in ipairs(enemies) do
    if p.IsAlive then
        local pos = p:GetBonePosition("HumanoidRootPart")
        if pos then
            print(p.Name, pos.X, pos.Y, pos.Z, "hp:", p.Health)
        end
    end
end
```

---

## `GetLocalPlayer`

```lua
entity.GetLocalPlayer() → player_userdata
```

Returns the local user as player userdata. Same field and method set as any enemy. This is the only reliable way to get yourself — `game.GetService("Players").LocalPlayer` is `nil` in the Serotonin sandbox.

```lua
local me = entity.GetLocalPlayer()
if me and me.IsAlive then
    print(string.format("HP %d/%d", me.Health, me.MaxHealth))
end
```

---

## `GetTarget`

```lua
entity.GetTarget() → player_userdata | nil
```

Returns whoever the cheat's aim system is currently locked onto, or `nil` when nothing is targeted.

```lua
cheat.register("onUpdate", function()
    local tgt = entity.GetTarget()
    if tgt and tgt.IsAlive and tgt.IsEnemy then
        print("locked:", tgt.Name, "hp:", tgt.Health)
    end
end)
```

---

## `GetParts` / `GetPartsCount`

```lua
entity.GetParts()      → table of numbers
entity.GetPartsCount() → int
```

The cheat's cached part list. Returns a table of **raw numeric addresses** (not Instance userdata). Many games leave this empty — always check `GetPartsCount() > 0` first. `GetPartsCount()` is cheaper when you only need the length.

```lua
if entity.GetPartsCount() > 0 then
    for i, addr in ipairs(entity.GetParts()) do
        print(i, string.format("0x%X", addr))
    end
end
```

---

## `AddModel` / `EditModel` / `RemoveModel` / `ClearModels`

Register Roblox Models as custom entities so they appear in `GetPlayers()` calls and get ESP/aim treatment.

```lua
entity.AddModel("boss_npc", {
    Character   = workspace:FindFirstChild("BossNPC"),
    PrimaryPart = workspace.BossNPC:FindFirstChild("HumanoidRootPart"),
    Name        = "Boss",
    Team        = "Enemy",
    Health      = 500,
    MaxHealth   = 500,
})

entity.EditModel("boss_npc", { Health = 250 })

entity.RemoveModel("boss_npc")

-- shutdown cleanup
cheat.register("shutdown", function()
    entity.ClearModels()
end)
```

`AddModel` validates that `data` is a table but does not validate field shapes — missing or extra fields do not raise. `RemoveModel` returns `false` for unknown keys, `true` on success.

---

## Patterns

### Enemies-only ESP box from BoundingBox

```lua
cheat.register("onPaint", function()
    for _, p in ipairs(entity.GetPlayers(true)) do
        if not p.IsAlive then goto continue end
        local bb = p.BoundingBox
        if bb and bb.w and bb.w > 0 then
            draw.Rect(bb.x, bb.y, bb.w, bb.h,
                Color3.fromRGB(255, 80, 80), 1, 0, 255)
        end
        ::continue::
    end
end)
```

### Health bar above head

```lua
cheat.register("onPaint", function()
    for _, p in ipairs(entity.GetPlayers(true)) do
        if not p.IsAlive then goto continue end
        local head = p:GetBonePosition("Head")
        if not head then goto continue end
        local x, y, on = utility.WorldToScreen(head)
        if not on then goto continue end
        local pct = math.max(0, math.min(1, p.Health / math.max(1, p.MaxHealth)))
        local bw = 32
        draw.Rect      (x - bw/2 - 1, y - 16, bw + 2, 5, Color3.new(0,0,0), 1, 0, 200)
        draw.RectFilled(x - bw/2,     y - 15, bw * pct, 3, Color3.fromRGB(0, 220, 0), 0, 255)
        ::continue::
    end
end)
```

### Include teammate positions via workspace fallback

```lua
-- Entity cache only has bone data for enemies; teammates need workspace
local function get_world_pos(p)
    local pos = p:GetBonePosition("HumanoidRootPart")
    if pos and (pos.X ~= 0 or pos.Y ~= 0 or pos.Z ~= 0) then
        return pos
    end
    local char = game.Workspace:FindFirstChild(p.Name)
    local hrp  = char and char:FindFirstChild("HumanoidRootPart")
    return hrp and hrp.Position or nil
end
```
