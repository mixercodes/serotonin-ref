# `Instance`

Roblox Instance userdata returned by `game.Workspace`, `:FindFirstChild`, and the rest of the tree-walk API. Every property read and method call goes through the cheat's safe-accessor layer.

**Property names are case-sensitive.** `instance.position` returns `nil`; `instance.Position` returns the value. Different Roblox classes expose different properties — reading a property that doesn't exist on the underlying class returns `nil` without error.

**`IsA` supports class hierarchy.** `part:IsA("BasePart")` returns `true` for a `MeshPart`. However it does not go all the way up — `part:IsA("Instance")` returns `false`. Use concrete or intermediate class names.

## Properties

All casings resolve — `instance.Position`, `instance.position`, and `instance.POSITION` all work.

**Property names are case-sensitive** in the sense that a wrong spelling returns `nil` without error — but the sandbox accepts PascalCase, camelCase, and snake_case variants of each name.

### Universal (all instances)

| Property | Type | Notes |
|---|---|---|
| `Name` | `string` | Writable |
| `ClassName` | `string` | Read-only |
| `Parent` | `Instance` | The parent in the hierarchy |
| `Address` | `number` | Low 32 bits of the C++ instance pointer — stable unique ID per session |

### BasePart

| Property | Type | Notes |
|---|---|---|
| `Position` | `Vector3` | World-space center, **writable** |
| `Size` | `Vector3` | Bounding box dimensions |
| `Velocity` | `Vector3` | Physics velocity, **writable** |
| `Rotation` | `Vector3` | Euler XYZ in degrees |
| `Color` | `Color3` | Surface color, **writable** |
| `Material` | `string` | Material name |
| `Transparency` | `number` | 0–1, **writable** |
| `Reflectance` | `number` | 0–1, **writable** |
| `CanCollide` | `boolean` | **Writable** |
| `MeshId` | `string` | Asset ID (MeshPart only) |
| `TextureId` | `string` | Texture asset ID |
| `SoundId` | `string` | Sound asset ID (Sound instances) |

### Humanoid

| Property | Type | Notes |
|---|---|---|
| `Health` | `number` | Current HP |
| `MaxHealth` | `number` | Max HP |
| `MoveDirection` | `Vector3` | Walk direction |

### Camera

| Property | Type | Notes |
|---|---|---|
| `LookVector` | `Vector3` | Forward axis of the camera CFrame |
| `RightVector` | `Vector3` | Right axis |
| `UpVector` | `Vector3` | Up axis |
| `Fov` / `FieldOfView` | `number` | Field of view in radians. `1.2217...` ≈ 70° |
| `CameraSubject` | `Instance` | The subject the camera follows |

`CFrame` is **blocked** — raises `"property 'CFrame' does not exist"`.

### Player (Instance via GetService)

| Property | Type | Notes |
|---|---|---|
| `Character` | `Instance` | The player's character model |

### Highlight

| Property | Type | Notes |
|---|---|---|
| `FillColor` | `Color3` | |
| `OutlineColor` | `Color3` | |
| `FillTransparency` | `number` | |
| `DepthMode` | `number` | |

### ValueBase types

| Property | Type | Notes |
|---|---|---|
| `Value` | `any` | Generic value accessor (StringValue, NumberValue, etc.) |

Specific typed aliases also work: read `StringValue.Value`, `NumberValue.Value`, `BoolValue.Value`, `ObjectValue.Value` etc.

### TextLabel / UI

| Property | Type | Notes |
|---|---|---|
| `Text` | `string` | Text content |
| `TextColor3` | `Color3` | Text color |

### NOT accessible

`CFrame`, `Anchored`, `Locked`, `Massless`, `AssemblyLinearVelocity` — all return `nil` or raise.

---

## Tree walk

| Method | Returns |
|---|---|
| `:GetChildren()` | table of direct children |
| `:GetDescendants()` | table of all descendants (expensive on large trees) |
| `:FindFirstChild(name)` | first child with matching Name, or `nil` |
| `:FindFirstChildOfClass(className)` | first child with matching ClassName, or `nil` |
| `:FindFirstDescendant(name)` | first descendant with matching Name |
| `:FindFirstDescendantOfClass(className)` | first descendant with matching ClassName |
| `:FindFirstAncestor(name)` | first ancestor with matching Name |
| `:FindFirstAncestorOfClass(className)` | first ancestor with matching ClassName |

```lua
local char = game.Workspace:FindFirstChild("PlayerName")
local hrp  = char and char:FindFirstChild("HumanoidRootPart")
local hum  = char and char:FindFirstChildOfClass("Humanoid")
```

## Type and hierarchy

```lua
instance:IsA(className)             → bool   -- supports class hierarchy: MeshPart:IsA("BasePart") = true
instance:IsDescendantOf(ancestor)   → bool
instance:IsAncestorOf(descendant)   → bool
instance:Destroy()                           -- do NOT call on live game instances
```

## Attributes

Attributes are invisible to workspace dumps — `grep_dump` cannot find them. Use these methods to read per-instance state flags.

```lua
instance:GetAttributes()               → array of {Name, Value, TypeName}
instance:GetAttribute(name)            → any | nil
instance:GetFirstAttributeOfType(type) → any
instance:SetAttribute(name, value)
```

`GetAttributes()` returns an **array** — iterate with `pairs` or `ipairs`:

```lua
for _, attr in ipairs(char:GetAttributes()) do
    print(attr.Name, attr.TypeName, attr.Value)
end
```

Note: `Value` for a boolean attribute may be exposed as a number in the sandbox. Check `type(attr.Value)` before comparing.

## Visual / lifecycle

```lua
instance:SetHighlightOnTop()              -- boolean or no arg (defaults to toggle)
instance:SetHighlightTransparency(value)  -- any number accepted, no clamping; 0..1 assumed but unverified
instance:Destroy()                        -- do NOT call on live game instances
```

## Patterns

### Find all players' characters

```lua
local ws = game.Workspace
for _, p in ipairs(game.GetService("Players"):GetChildren()) do
    local char = ws:FindFirstChild(p.Name)
    if char then
        local hrp = char:FindFirstChild("HumanoidRootPart")
        if hrp then
            print(p.Name, hrp.Position)
        end
    end
end
```

### Read a per-player state flag

```lua
local char = game.Workspace:FindFirstChild(p.Name)
if char then
    local flag = char:GetAttribute("IsBlocking")
    -- flag may be bool or number — check type
    if flag ~= nil and flag ~= false and flag ~= 0 then
        -- player is blocking
    end
end
```
