# `Player`

Userdata returned by `entity.GetPlayers()`, `entity.GetLocalPlayer()`, and `entity.GetTarget()`. Pre-cached snapshot of a Roblox player — properties and bone positions are already extracted from the engine.

**Cache lifetime.** Re-pull from `entity.GetPlayers()` each tick. Do not store references across frames.

**Entity cache covers enemies only.** `GetBonePosition` and `BoundingBox` return zero/empty for teammates. Fall back to workspace for teammate bone positions.

## Properties

| Name | Type | Notes |
|---|---|---|
| `Name` | `string` | Roblox username |
| `DisplayName` | `string` | Roblox display name |
| `UserId` | `number` | persistent user ID |
| `Team` | `string` | team name, empty when neutral |
| `Weapon` | `string` | equipped weapon model name, empty when unarmed |
| `Position` | `Vector3` | **often `(0,0,0)`** in FFA modes — use `GetBonePosition("HumanoidRootPart")` |
| `Velocity` | `Vector3` | normalized walk direction, not raw physics velocity |
| `Health` | `number` | current HP |
| `MaxHealth` | `number` | max HP |
| `IsAlive` | `bool` | humanoid alive and spawned |
| `IsEnemy` | `bool` | on the opposing team |
| `IsVisible` | `bool` | `true` when not occluded. **Requires at least one Visible Only check active in Serotonin** (ESP, Aimbot, or Triggerbot) — returns `false` for all players when none are enabled |
| `IsWhitelisted` | `bool` | added via `game.PlayerWhitelist` |
| `TeamColor` | `userdata` | `.R`, `.G`, `.B` are `0..255` bytes — use `Color3.fromRGB(tc.R, tc.G, tc.B)` |
| `BoundingBox` | `table {x, y, w, h}` | screen-space pixel rect; all zeros when off-screen or teammate |

## Bone methods

| Method | Returns |
|---|---|
| `:GetBonePosition(name)` | `Vector3 \| nil` — **can return nil**, always guard |
| `:GetBoneSize(name)` | `Vector3` |
| `:GetBoneRotation(name)` | flat 9-element rotation matrix table |
| `:GetBoneInstance(name)` | underlying Roblox `Instance` or `nil` |

**`GetBonePosition` can return `nil`**, not just `Vector3(0,0,0)`. Always check:

```lua
local b = p:GetBonePosition("Head")
if not b then return end   -- nil guard
if b.X == 0 and b.Y == 0 and b.Z == 0 then return end   -- zero guard
```

## R15 bone names

Standard names: `HumanoidRootPart`, `Head`, `UpperTorso`, `LowerTorso`, `LeftUpperArm`, `RightUpperArm`, `LeftUpperLeg`, `RightUpperLeg`, `LeftLowerArm`, `RightLowerArm`, `LeftHand`, `RightHand`, `LeftLowerLeg`, `RightLowerLeg`, `LeftFoot`, `RightFoot`

R6 uses: `Torso`, `Left Arm`, `Right Arm`, `Left Leg`, `Right Leg`, `Head`

Detect rig type: `char:FindFirstChild("UpperTorso") ~= nil` → R15, otherwise R6.

---

## Patterns

### Basic enemy ESP

```lua
cheat.register("onPaint", function()
    for _, p in ipairs(entity.GetPlayers(true)) do
        if not p.IsAlive then goto continue end
        local head = p:GetBonePosition("Head")
        if not head then goto continue end
        local x, y, on = utility.WorldToScreen(head)
        if on then
            draw.TextOutlined(p.Name, x, y - 16,
                Color3.fromRGB(255, 80, 80), "Verdana", 255)
        end
        ::continue::
    end
end)
```

### Teammate position via workspace fallback

```lua
local function get_pos(p)
    local b = p:GetBonePosition("HumanoidRootPart")
    if b and (b.X ~= 0 or b.Y ~= 0 or b.Z ~= 0) then return b end
    local char = game.Workspace:FindFirstChild(p.Name)
    local hrp  = char and char:FindFirstChild("HumanoidRootPart")
    return hrp and hrp.Position or nil
end
```

### Convert TeamColor to Color3

```lua
local function team_to_color3(p)
    local tc = p.TeamColor
    return Color3.fromRGB(tc.R, tc.G, tc.B)
end
```
