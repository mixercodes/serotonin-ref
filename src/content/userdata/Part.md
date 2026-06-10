# `Part`

Userdata returned by `entity.GetParts()`. Pre-cached projection of a Roblox `BasePart` — position, size, rotation, and a precomputed OBB, without walking the DataModel each frame.

**Not the same as a Roblox Instance.** The `:GetPart*` methods below exist only on this userdata. A Workspace `BasePart` obtained from `game.Workspace:FindFirstChild(...)` does not have them.

**`entity.GetParts()` is often empty.** Many games return `0` parts. Always check `entity.GetPartsCount() > 0` before iterating. For a workspace-bound `BasePart`, use `draw.GetPartCorners(inst)` instead — its corner ordering is canonical and fully proven (`corners[1]`/`corners[8]` diagonally opposite, the three edges leaving corner 1 are the local axes scaled by `Size`); see [`draw.GetPartCorners`](/docs/libraries/draw#getpartcorners) for the full convention.

**Cache lifetime.** The userdata is only valid for the current frame. Do not store across frames. To track a part across frames, store `:GetPartAddress()` — the engine pointer is stable while the instance lives, where the userdata is not.

## Methods

### Pose

| Method | Returns |
|---|---|
| `:GetPartPosition()` | `number` — **raw value, not Vector3**. Use `:GetPartInstance().Position` for a usable Vector3. |
| `:GetPartSize()` | `number` — **raw value, not Vector3**. Use `:GetPartInstance().Size` for a usable Vector3. |
| `:GetPartRotation()` | `table` — flat 9-element rotation matrix |
| `:GetPartCubeVertices()` | `table` — 8 entries, each a numeric table `{[1]=x, [2]=y, [3]=z}` — **not Vector3**. Wrap with `Vector3.new(v[1], v[2], v[3])` before passing to `utility.WorldToScreen`. |

### Identity

| Method | Returns |
|---|---|
| `:GetPartInstance()` | underlying Roblox `Instance` |
| `:GetPartAddress()` | `number` — raw uint64 pointer |
| `:GetPartPrimitive()` | `number` — raw Primitive struct address |
| `:GetPartClassName()` | `string` — Roblox ClassName |

**`:GetPartAddress()` is the real engine instance pointer.** Verified: `part:GetPartAddress() == part:GetPartInstance().Address` for the same part. Two uses:

- **Stable unique id** — track a part across frames (the userdata itself is frame-scoped; the address is not).
- **Base address for `memory.Read`** of sandbox-hidden properties (`Shape`, `Material`, decal/mesh ids, …) — see [hidden properties](/docs/roblox/hidden-properties).

**`:GetPartPrimitive()` is the engine's Primitive pointer.** Verified equal to the pointer read at the instance's BasePart `Primitive` offset via `memory.Read`. Primitive-relative properties (e.g. `Material`, a ushort) hang off this value — guard with `memory.IsValid` before dereferencing.

> [!NOTE]
> Offsets shift across Roblox engine updates — resolve them from the saveinstance version json at load instead of hardcoding. Technique and property catalog in [hidden properties](/docs/roblox/hidden-properties).

### Visual

| Method | Returns |
|---|---|
| `:GetPartColor()` | `number` — **raw value, not Color3**. Use `:GetPartInstance().Color` for a usable Color3. |
| `:GetPartTransparency()` | `number` (0..1) |
| `:GetPartMeshId()` | `string` or `nil` |

### Spatial

> [!WARNING]
> **No built-in screen-projection or distance methods in the current build.** `:GetPartScreenPosition()` and `:GetPartDistance()` are **not bound** on the Part userdata — both index to `nil` and raise *"attempt to call method … (a nil value)"*. Project manually by feeding `:GetPartInstance().Position` (a real `Vector3`) into `utility.WorldToScreen`, and compute camera distance as `(part:GetPartInstance().Position - game.CameraPosition).Magnitude`.

## The underlying Instance

`:GetPartInstance()` returns a live Roblox `Instance`, subject to the usual sandbox holes:

- **`.CFrame` and `.Orientation` are `nil`** — on all parts, workspace statics and the local player's character included. For rotation, use `:GetPartRotation()` (flat 9-element matrix) on this userdata, or `draw.GetPartCorners(inst)` on any workspace part.
- **`.Shape` is `nil`** on `Part` instances. The `Enum.PartType` byte is readable via memory at the BasePart `Shape` offset — technique in [hidden properties](/docs/roblox/hidden-properties), enum values and Ball/Cylinder render semantics in [part shapes](/docs/roblox/part-shapes).
- **`.Material` reads `"Unknown"`** — readable at the Primitive (see `:GetPartPrimitive()` above).
- `.Position`, `.Size`, and `.Color` work — `.Color`'s `.R/.G/.B` are 0–255 integers.

---

## Patterns

### Render all visible cached parts

`GetPartScreenPosition` does not exist — project the instance position yourself:

```lua
cheat.register("onPaint", function()
    if entity.GetPartsCount() == 0 then return end
    for _, part in ipairs(entity.GetParts()) do
        local inst = part:GetPartInstance()
        local pos  = inst and inst.Position          -- a real Vector3
        if pos then
            local x, y, on = utility.WorldToScreen(pos)
            if on then
                draw.Circle(x, y, 4, Color3.fromRGB(255, 200, 50), 1, 12, 200)
            end
        end
    end
end)
```

### OBB box ESP

```lua
local function vert_to_screen(v)
    -- verts are {[1]=x,[2]=y,[3]=z} tables, not Vector3
    return utility.WorldToScreen(Vector3.new(v[1], v[2], v[3]))
end

cheat.register("onPaint", function()
    for _, part in ipairs(entity.GetParts()) do
        local verts = part:GetPartCubeVertices()
        for i = 1, 8 do
            local j = (i % 8) + 1
            local ax, ay, aon = vert_to_screen(verts[i])
            local bx, by, bon = vert_to_screen(verts[j])
            if aon and bon then
                draw.Line(ax, ay, bx, by, Color3.fromRGB(255,200,50), 1, 255)
            end
        end
    end
end)
```
