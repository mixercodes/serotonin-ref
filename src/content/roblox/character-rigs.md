# Character rigs

How Roblox avatars are structured at runtime — bone names, rig detection, accessories, held tools — and how to work with them from the Serotonin sandbox, where `CFrame` is `nil` and the entity cache only tracks enemies. Everything below is runtime-verified.

## R6 vs R15

Every character is a `Model` in `game.Workspace` named after the player. It contains the body parts, a `Humanoid`, and any `Accessory` / `Tool` instances. There are two rig generations:

| | R6 | R15 |
|---|---|---|
| Body parts | 6 | 15 |
| Limb classes | literal `Part` boxes | `MeshPart`s |
| Torso | single `Torso` | `UpperTorso` + `LowerTorso` |
| Names with spaces | yes (`Left Arm`) | no (`LeftUpperArm`) |

Detect the rig by checking for `UpperTorso`:

```lua
local function rig_type(char)
    if char and char:FindFirstChild("UpperTorso") then
        return "R15"
    end
    return "R6"
end
```

### R6 bone names

| Bone | Notes |
|---|---|
| `HumanoidRootPart` | invisible root, the character's reference frame |
| `Head` | |
| `Torso` | single torso part |
| `Left Arm`, `Right Arm` | **names contain spaces** |
| `Left Leg`, `Right Leg` | **names contain spaces** |

### R15 bone names

| Region | Bones |
|---|---|
| Root / head | `HumanoidRootPart`, `Head` |
| Torso | `UpperTorso`, `LowerTorso` |
| Left arm | `LeftUpperArm`, `LeftLowerArm`, `LeftHand` |
| Right arm | `RightUpperArm`, `RightLowerArm`, `RightHand` |
| Left leg | `LeftUpperLeg`, `LeftLowerLeg`, `LeftFoot` |
| Right leg | `RightUpperLeg`, `RightLowerLeg`, `RightFoot` |

> [!NOTE]
> Bone names passed to `p:GetBonePosition(name)` are the literal part names, spaces included. A skeleton ESP that hardcodes R15 names draws nothing on an R6 character — branch on `rig_type` and use the matching set.

### Silhouettes

- **R6 limbs are literal boxes** — the part box *is* the visual silhouette. `draw.GetPartCorners(limb)` gives the exact rendered shape; no mesh involved.
- **R15 limbs are MeshParts** — the part box is only a bounding volume. For exact limb geometry use [`draw.GetMesh`](/docs/libraries/draw) (MeshParts only, `onPaint`-only, raises a C++ exception on other classes).
- R15 limbs commonly have an empty `TextureId` plus a real `SurfaceAppearance` child whose `ColorMap` carries the actual skin — see [surfaces and decals](/docs/roblox/surfaces-decals).

## Accessories

Hats, hair, and gear are `Accessory` instances under the character. Each one wraps a single `Handle` part that carries the visual:

```text
Character (Model)
├── HumanoidRootPart, Head, UpperTorso, ...
├── Humanoid
├── Accessory "ModernHat"
│   └── Handle (MeshPart)            -- MeshId on the part itself
├── Accessory "ClassicHat"
│   └── Handle (Part)
│       └── SpecialMesh              -- MeshId/TextureId/Scale sandbox-hidden
└── Tool "Sword"                     -- only present while held
    └── Handle
```

Two handle styles exist:

- **Modern**: `Handle` is a `MeshPart` with its mesh referenced directly via `MeshId`.
- **Classic**: `Handle` is a plain `Part` with a `SpecialMesh` child. The `SpecialMesh`'s `MeshId`, `TextureId`, `Scale`, and `Offset` are hidden by the sandbox (they read as `""` / `nil`) — recover them via [memory offsets](/docs/roblox/hidden-properties), and apply them using the [classic mesh semantics](/docs/roblox/classic-meshes) (FileMesh renders at native size × Scale, anchored at the part, not fitted to it).

Accessories are part of the visual silhouette — a hull or chams renderer that skips them draws a noticeably smaller character than the player sees.

## Held tools

A held item appears as a `Tool` child of the character, with a `Handle` part. It is only parented there while held — when unequipped it leaves the character model, so its absence does not mean the player owns nothing.

```lua
local char = game.Workspace:FindFirstChild(p.Name)
local tool = char and char:FindFirstChildOfClass("Tool")
if tool then
    -- tool.Name identifies the item; tool:FindFirstChild("Handle") is the part
end
```

## Recovering facing without CFrame

`HumanoidRootPart.CFrame` is `nil` for **all** players, including the local player — `LookVector`, `RightVector`, and `GetComponents()` are all inaccessible, the same as for [every other part](/docs/libraries/draw) in the sandbox. Characters face their root part's local **−Z** (`Front` — see [NormalId](/docs/roblox/surfaces-decals)). Three ways to recover that direction, ranked by exactness:

### 1. From the part box (exact — needs the Instance)

`draw.GetPartCorners(hrp)` returns the oriented box with a canonical, sign-exact corner ordering: `corners[5] - corners[1]` is the part's local **+Z** axis scaled by `Size.Z`, so forward is its negation. Verified against body asymmetry on a live character (see [`GetPartCorners`](/docs/libraries/draw) for the full convention).

```lua
local function facing_from_hrp(hrp)
    local c = draw.GetPartCorners(hrp)
    if not c then return nil end
    local w = c[5] - c[1]               -- local +Z axis (backward)
    local fx, fz = -w.X, -w.Z           -- characters face local -Z
    local len = math.sqrt(fx * fx + fz * fz)
    if len < 1e-6 then return nil end
    return fx / len, fz / len
end
```

Get the Instance via `p:GetBoneInstance("HumanoidRootPart")` for enemies, or a workspace lookup for anyone else.

### 2. From the skeleton (bone positions only)

When all you have is bone positions (the entity cache path), the left→right axis between symmetric limbs gives the character's right vector. Sum the shoulder line **and** the hip line — arms and legs counter-swing during a stride, so summing cancels the wobble. Then `LookVector = Up × Right`, which works out to `forward = (right.z, −right.x)`, horizontal, normalized. Works while standing still and follows in-place turns.

```lua
local function facing_from_skeleton(get_pos, is_r15)
    local ra, la, rl, ll
    if is_r15 then
        ra, la = get_pos("RightUpperArm"), get_pos("LeftUpperArm")
        rl, ll = get_pos("RightUpperLeg"), get_pos("LeftUpperLeg")
    else
        ra, la = get_pos("Right Arm"), get_pos("Left Arm")
        rl, ll = get_pos("Right Leg"), get_pos("Left Leg")
    end
    if not (ra and la and rl and ll) then return nil end

    local rx = (ra.X - la.X) + (rl.X - ll.X)   -- right vector =
    local rz = (ra.Z - la.Z) + (rl.Z - ll.Z)   -- shoulder line + hip line

    local fx, fz = rz, -rx                     -- forward = Up x Right
    local len = math.sqrt(fx * fx + fz * fz)
    if len < 1e-4 then return nil end
    return fx / len, fz / len
end
```

### 3. From movement delta (last resort)

Cache the last non-zero per-tick position delta as the facing direction. The cached value persists while the player stands still, but this method **cannot follow in-place turns** — use it only when the skeleton exposes just `Head` and `HumanoidRootPart`.

```lua
local last_pos  = {}
local last_face = {}

cheat.register("onUpdate", function()
    for _, p in ipairs(entity.GetPlayers(true)) do
        if p.IsAlive then
            local pos = p:GetBonePosition("HumanoidRootPart")
            if pos then
                local prev = last_pos[p.Name]
                if prev then
                    local dx, dz = pos.X - prev.X, pos.Z - prev.Z
                    local len = math.sqrt(dx * dx + dz * dz)
                    if len > 1e-3 then
                        last_face[p.Name] = { dx / len, dz / len }
                    end
                end
                last_pos[p.Name] = pos
            end
        end
    end
end)
```

## Entity cache interplay

The [`entity`](/docs/libraries/entity) library is the fast path for character data, but its coverage is uneven — full reference on that page; the rig-relevant rules are:

> [!WARNING]
> **The entity cache only maintains bone data for enemies.** `p:GetBonePosition()` returns `(0,0,0)` for teammates even when they are alive and moving, and `p.BoundingBox` is an empty table for them. Teammates need a workspace fallback.

> [!WARNING]
> **`GetBonePosition` can return `nil`** despite documentation claiming a zero vector for missing bones. Guard for `nil` first, then check for the zero vector separately — both cases occur in production.

```lua
-- Entity-first bone getter with workspace fallback.
-- Pass the character looked up ONCE per player per frame, not per bone.
local function make_bone_getter(p, char)
    return function(name)
        local b = p:GetBonePosition(name)
        if b and (b.X ~= 0 or b.Y ~= 0 or b.Z ~= 0) then return b end
        local part = char and char:FindFirstChild(name)
        return part and part.Position or nil
    end
end

cheat.register("onPaint", function()
    for _, p in ipairs(entity.GetPlayers(false)) do
        if not p.IsAlive then goto continue end
        -- enemies never need the workspace lookup; only pay it for teammates
        local char = nil
        if not p.IsEnemy then
            char = game.Workspace:FindFirstChild(p.Name)
        end
        local get_pos = make_bone_getter(p, char)
        local is_r15  = get_pos("UpperTorso") ~= nil   -- rig detection through the same guards
        -- ... draw with get_pos(...)
        ::continue::
    end
end)
```

> [!NOTE]
> `entity.GetPlayers(false)` **excludes the local player.** Use `entity.GetLocalPlayer()` for yourself — `game.GetService("Players").LocalPlayer` is `nil` in the sandbox. The local player's bones also fall on the workspace-fallback path: look up `game.Workspace:FindFirstChild(entity.GetLocalPlayer().Name)`.

Performance discipline for skeleton features: one `game.Workspace:FindFirstChild(name)` per player per frame, passed down to every helper. A per-bone lookup (10 bones × 16 players × 60 fps) is a measurable frame-time sink; the single-lookup version is not.

## Official references

- [R6 vs R15](https://create.roblox.com/docs/characters/r6-vs-r15) — official rig comparison
- [Accessory](https://create.roblox.com/docs/reference/engine/classes/Accessory) / [Tool](https://create.roblox.com/docs/reference/engine/classes/Tool) — class references
- [Enum.BodyPart](https://create.roblox.com/docs/reference/engine/enums/BodyPart) — the classic CharacterMesh body-part enum
