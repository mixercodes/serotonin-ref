# `Part`

Userdata returned by `entity.GetParts()`. Pre-cached projection of a Roblox `BasePart` — position, size, rotation, and a precomputed OBB, without walking the DataModel each frame.

**Not the same as a Roblox Instance.** The `:GetPart*` methods below exist only on this userdata. A Workspace `BasePart` obtained from `game.Workspace:FindFirstChild(...)` does not have them.

**`entity.GetParts()` is often empty.** Many games return `0` parts. Always check `entity.GetPartsCount() > 0` before iterating. For a workspace-bound `BasePart`, use `draw.GetPartCorners(inst)` instead.

**Cache lifetime.** The userdata is only valid for the current frame. Do not store across frames.

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

### Visual

| Method | Returns |
|---|---|
| `:GetPartColor()` | `number` — **raw value, not Color3**. Use `:GetPartInstance().Color` for a usable Color3. |
| `:GetPartTransparency()` | `number` (0..1) |
| `:GetPartMeshId()` | `string` or `nil` |

### Spatial

| Method | Returns |
|---|---|
| `:GetPartDistance()` | `number` — distance from local camera |
| `:GetPartScreenPosition()` | `number, number, bool` — `screenX, screenY, onScreen` |

---

## Patterns

### Render all visible cached parts

```lua
cheat.register("onPaint", function()
    if entity.GetPartsCount() == 0 then return end
    for _, part in ipairs(entity.GetParts()) do
        local x, y, on = part:GetPartScreenPosition()
        if on then
            draw.Circle(x, y, 4, Color3.fromRGB(255, 200, 50), 1, 12, 200)
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
