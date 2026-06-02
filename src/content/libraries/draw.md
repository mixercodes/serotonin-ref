# `draw`

2D overlay rendering. All drawing calls are one-frame — nothing persists between frames. 18 functions total: 13 drawing primitives and 5 geometry/utility helpers.

| | |
|---|---|
| **Primitives** | 13 (must be called inside `onPaint`) |
| **Utilities** | 5 (`GetScreenSize`, `GetTextSize`, `ComputeConvexHull`, `GetPartCorners`, `GetMesh` — callable anywhere) |
| **Aliases** | two-form for single-word verbs (`Line`/`line`), three-form for multi-word names (`RectFilled`/`rectFilled`/`rect_filled`) |

## Coordinate system

`(0, 0)` is the top-left of the Roblox window. `x` increases right, `y` increases down. Units are pixels. Use `GetScreenSize` to get the window bounds.

## Color and alpha

Color arguments always expect a `Color3` userdata — not packed integers. Use `Color3.fromRGB(r, g, b)` (0–255 per channel) or `Color3.new(r, g, b)` (0–1 per channel).

**Alpha is a `0..255` integer, not a 0..1 float.** The engine treats the alpha argument as a byte: `255` = fully opaque, `0` = fully transparent, `128` ≈ 50%. Passing `1` renders at roughly 0.4% opacity (essentially invisible). Always use integers in 0–255.

## Fonts

| Font name | Width × Height of `"Hello, World!"` |
|---|---|
| `"ConsolasBold"` | 104 × 15 |
| `"SmallestPixel"` | 61 × 10 |
| `"Verdana"` | 80 × 15 |
| `"Tahoma"` | 71 × 15 |
| omit / unknown | 71 × 15 (default, matches Tahoma) |

Unknown font names fall back to the default silently.

---

## `Line`

```lua
draw.Line(x1, y1, x2, y2, color: Color3, thickness?: number, alpha?: number)
```

Draws a straight line from `(x1, y1)` to `(x2, y2)`. `thickness` defaults to `1`. `alpha` is `0..255`.

```lua
cheat.register("onPaint", function()
    draw.Line(100, 100, 300, 100, Color3.fromRGB(255, 255, 255), 1, 255)
end)
```

---

## `Rect` / `RectFilled`

```lua
draw.Rect      (x, y, w, h, color: Color3, thickness?, rounding?, alpha?)
draw.RectFilled(x, y, w, h, color: Color3, rounding?, alpha?)
```

`Rect` draws an outline rectangle, `RectFilled` fills it. `rounding` is the corner radius in pixels (`0` = sharp). `alpha` is `0..255`.

```lua
cheat.register("onPaint", function()
    draw.Rect      (10, 10, 100, 30, Color3.new(1, 1, 1), 1, 0, 255)
    draw.RectFilled(10, 50, 100, 30, Color3.fromRGB(50, 50, 65), 4, 220)
end)
```

---

## `Circle` / `CircleFilled`

```lua
draw.Circle      (x, y, r, color: Color3, thickness?, segments?, alpha?)
draw.CircleFilled(x, y, r, color: Color3, segments?, alpha?)
```

`segments` controls polygon resolution — default is `12` (low-poly). Pass `32` or `64` for smooth circles. `alpha` is `0..255`.

```lua
draw.Circle      (250, 130, 15, Color3.fromRGB(50, 220, 50),  1, 32, 255)
draw.CircleFilled(280, 130, 12, Color3.fromRGB(70, 130, 240), 32, 180)
```

---

## `Triangle` / `TriangleFilled`

```lua
draw.Triangle      (x1, y1, x2, y2, x3, y3, color: Color3, thickness?, alpha?)
draw.TriangleFilled(x1, y1, x2, y2, x3, y3, color: Color3, alpha?)
```

```lua
draw.TriangleFilled(380, 100, 420, 100, 400, 140, Color3.fromRGB(255, 50, 50), 180)
```

---

## `Polyline`

```lua
draw.Polyline(points: table, color: Color3, closed: bool, thickness: number, alpha?)
```

Connects consecutive `{x, y}` points with lines. `closed = true` connects the last point back to the first. `alpha` is `0..255`.

```lua
draw.Polyline(
    {{440, 100}, {460, 140}, {480, 100}, {500, 140}},
    Color3.new(1, 1, 1), false, 1, 255)
```

---

## `ConvexPolyFilled`

```lua
draw.ConvexPolyFilled(points: table, color: Color3, alpha?)
```

Fills a convex polygon. Points must be ordered and convex (no self-intersections). Pair with `ComputeConvexHull` when input points may be arbitrary. `alpha` is `0..255`.

```lua
local pts = {{520, 100}, {570, 100}, {595, 140}, {545, 160}, {520, 140}}
draw.ConvexPolyFilled(pts, Color3.fromRGB(70, 130, 240), 180)
```

---

## `Gradient`

```lua
draw.Gradient(x, y, w, h, c1: Color3, c2: Color3, isHorizontal: bool, alpha1?, alpha2?)
```

Two-stop linear gradient inside a rectangle. `isHorizontal = true` blends left→right (c1→c2), `false` blends top→bottom. Both alpha arguments are `0..255`.

```lua
draw.Gradient(100, 200, 200, 30,
    Color3.fromRGB(255, 50, 50),
    Color3.fromRGB(70, 130, 240),
    true, 255, 255)
```

---

## `Text` / `TextOutlined`

```lua
draw.Text        (text: string, x, y, color: Color3, font?, alpha?, size?)
draw.TextOutlined(text: string, x, y, color: Color3, font?, alpha?, size?)
```

`TextOutlined` adds a 1-pixel dark border around each character — preferred for anything rendered over the game world. `font` is one of the verified [font names](#fonts). `size` overrides the font's native pixel height. `alpha` is `0..255`.

```lua
draw.TextOutlined("FPS: 144",  10, 10, Color3.fromRGB(230, 230, 230), "ConsolasBold", 255)
draw.TextOutlined("AIM",       10, 30, Color3.fromRGB(90, 220, 120),  "Verdana",      255)
draw.TextOutlined("BIG",       10, 60, Color3.fromRGB(255, 255, 255), "Verdana",      255, 36)
```

---

## `Image`

```lua
draw.Image(texId: number, x, y, w, h, color?: Color3, alpha?: number)
```

Renders a texture loaded via `utility.LoadImage`. `color` is an optional tint (`Color3`). `alpha` is `0..1` for Image specifically (this function is an exception to the 0-255 rule for other primitives).

| Call | Result |
|---|---|
| `Image(texid, x, y, w, h)` | renders, no tint |
| `Image(texid, x, y, w, h, Color3.fromRGB(255, 60, 60))` | red tint |
| `Image(texid, x, y, w, h, Color3.new(1,1,1), 0.5)` | 50% opacity |
| `Image(texid, x, y, w, h, 255)` | error: arg #6 must be `Color3`, not number |
| `Image(99999, x, y, w, h)` | silent no-op (invalid texid) |

```lua
local tex = utility.LoadImage(file.read("hud.png"))
if tex then
    cheat.register("onPaint", function()
        draw.Image(tex, 16, 16, 64, 64)
        draw.Image(tex, 96, 16, 64, 64, Color3.fromRGB(255, 60, 60))
    end)
end
```

---

## `GetScreenSize`

```lua
draw.GetScreenSize() → w: number, h: number
```

Returns the Roblox window size as two values (multi-return). Works inside and outside `onPaint`. Equivalent to `cheat.GetWindowSize()`.

```lua
local w, h = draw.GetScreenSize()
```

---

## `GetTextSize`

```lua
draw.GetTextSize(text: string, font?: string) → w: number, h: number
```

Returns the pixel dimensions the text would occupy when rendered. Useful for centering or padding labels. Unknown font names fall back to the default.

```lua
local w, h = draw.GetTextSize("ESP", "Verdana")
draw.Rect(10 - 2, 10 - 2, w + 4, h + 4, Color3.new(0, 0, 0), 1, 0, 128)
draw.TextOutlined("ESP", 10, 10, Color3.new(1, 1, 1), "Verdana", 255)
```

---

## `ComputeConvexHull`

```lua
draw.ComputeConvexHull(points: table) → table
```

Computes the 2D convex hull of a set of `{x, y}` points. Returns the hull in the same format. Empty or `nil` input returns `{}`. `Vector3` values are not accepted.

```lua
local hull = draw.ComputeConvexHull({
    {100, 100}, {120, 90}, {140, 110}, {130, 130}, {110, 125}
})
draw.ConvexPolyFilled(hull, Color3.fromRGB(255, 200, 50), 153)
```

---

## `GetPartCorners`

```lua
draw.GetPartCorners(part: Instance) → table of 8 Vector3
```

Returns the 8 world-space corners of a `BasePart`'s oriented bounding box as `Vector3` values, accounting for rotation. Project each corner with `utility.WorldToScreen` to draw an ESP box.

```lua
local corners = draw.GetPartCorners(part_inst)
local edges = {
    {1,2},{3,4},{5,6},{7,8},
    {1,3},{2,4},{5,7},{6,8},
    {1,5},{2,6},{3,7},{4,8},
}
for _, e in ipairs(edges) do
    local ax, ay, ona = utility.WorldToScreen(corners[e[1]])
    local bx, by, onb = utility.WorldToScreen(corners[e[2]])
    if ona and onb then
        draw.Line(ax, ay, bx, by, Color3.fromRGB(255, 200, 0), 1, 255)
    end
end
```

---

## `GetMesh`

```lua
draw.GetMesh(part: Instance) → ?
```

Returns mesh data for a `MeshPart`. Passing a regular `Part` raises `"Expected a MeshPart instance."`. Passing nothing or `nil` raises a type error.

---

## Patterns

### Screen-anchored HUD

```lua
cheat.register("onPaint", function()
    local W, H = draw.GetScreenSize()
    draw.RectFilled(W - 220, H - 80, 210, 70, Color3.new(0.08, 0.08, 0.1), 4, 220)
    draw.TextOutlined("v1.0",
        W - 212, H - 72, Color3.new(0.8, 0.8, 1.0), "ConsolasBold", 255)
    draw.TextOutlined(
        string.format("%.0f fps", 1 / math.max(utility.GetDeltaTime(), 0.0001)),
        W - 212, H - 54, Color3.fromRGB(100, 220, 100), "ConsolasBold", 255)
end)
```

### Centered text helper

```lua
local function draw_centered(text, cx, cy, color, font)
    local w, h = draw.GetTextSize(text, font)
    draw.TextOutlined(text, cx - w * 0.5, cy - h * 0.5, color, font, 255)
end
```

### Skeleton ESP

```lua
local LIMBS = {
    {"Head","UpperTorso"}, {"UpperTorso","LowerTorso"},
    {"UpperTorso","LeftUpperArm"}, {"UpperTorso","RightUpperArm"},
    {"LowerTorso","LeftUpperLeg"}, {"LowerTorso","RightUpperLeg"},
}

cheat.register("onPaint", function()
    for _, p in ipairs(entity.GetPlayers(true)) do
        if not p.IsAlive then goto continue end
        for _, pair in ipairs(LIMBS) do
            local a = p:GetBonePosition(pair[1])
            local b = p:GetBonePosition(pair[2])
            if not a or not b then goto continue end  -- GetBonePosition can return nil
            local sx, sy, son = utility.WorldToScreen(a)
            local ex, ey, eon = utility.WorldToScreen(b)
            if son and eon then
                draw.Line(sx, sy, ex, ey, Color3.fromRGB(220, 90, 90), 1, 255)
            end
        end
        ::continue::
    end
end)
```

### Box ESP from corners

```lua
cheat.register("onPaint", function()
    for _, p in ipairs(entity.GetPlayers(true)) do
        if not p.IsAlive then goto continue end
        local hrp = p:GetBoneInstance("HumanoidRootPart")
        if not hrp then goto continue end
        local corners = draw.GetPartCorners(hrp)
        local sx, sy = {}, {}
        local ok = true
        for i, c in ipairs(corners) do
            local x, y, on = utility.WorldToScreen(c)
            if not on then ok = false; break end
            sx[i], sy[i] = x, y
        end
        if ok then
            for i = 1, 8 do
                local j = (i % 8) + 1
                draw.Line(sx[i], sy[i], sx[j], sy[j], Color3.fromRGB(255, 255, 0), 1, 255)
            end
        end
        ::continue::
    end
end)
```
