# `Color3`

RGB color value used by all drawing calls and Roblox part properties.

**No arithmetic operators.** `red + blue` raises an error. Use `:Lerp` or compute manually.  
**`==` is identity-only.** Two value-equal colors are not `==` unless they are the same userdata.  
**`.R`, `.G`, `.B` are `0..1` floats** (Roblox standard), but `tostring(c)` prints `0..255` bytes.

---

## `new`

```lua
Color3.new(r, g, b) → Color3   -- components in 0..1
```

```lua
local c = Color3.new(0.9, 0.5, 0.1)   -- warm orange
```

---

## `fromRGB`

```lua
Color3.fromRGB(r, g, b) → Color3   -- components in 0..255, silently clamped
```

Out-of-range values clamp to `[0, 255]` with no error.

```lua
local red  = Color3.fromRGB(255, 0, 0)
local cyan = Color3.fromRGB(0, 255, 255)
draw.Rect(10, 10, 100, 30, red, 1, 0, 255)
```

---

## `fromHex`

```lua
Color3.fromHex(hex: string) → Color3
```

Accepts a 6-character hex string. The `#` prefix is optional, case does not matter.

**Short form (`#fff`) is not supported** — raises `"Invalid hex code, must be 6 characters long"`.

```lua
local accent = Color3.fromHex("#5BC0EB")
local warn   = Color3.fromHex("FFB400")
```

---

## `fromHSV`

```lua
Color3.fromHSV(h, s, v) → Color3   -- all in 0..1
```

```lua
-- Cycle hue over time
local hue = (utility.GetTickCount() % 3000) / 3000
local c   = Color3.fromHSV(hue, 1, 1)
```

---

## Instance methods

```lua
c:ToHex()          → "#RRGGBB"       -- uppercase, with leading #
c:ToHSV()          → h, s, v         -- multi-return, each 0..1
c:Lerp(other, t)   → Color3          -- component-wise, t not clamped
```

`Color3.fromRGB(255,0,0):ToHex()` = `"#FF0000"`.

```lua
local h, s, v  = my_color:ToHSV()
local shifted  = Color3.fromHSV((h + 0.5) % 1, s, v)   -- complementary hue
```

---

## `tostring`

`tostring(c)` prints channels as `"r, g, b"` in **0..255 byte scale**, not 0..1. Treat as debug output only, do not parse.

---

## Patterns

### Health-driven color

```lua
local function hp_color(ratio)
    return Color3.fromRGB(220, 60, 60):Lerp(
           Color3.fromRGB(60, 220, 90),
           math.max(0, math.min(1, ratio)))
end
```

### Team color to Color3

```lua
local function team_color(p)
    local tc = p.TeamColor   -- .R .G .B are 0..255 (not Color3 floats)
    return Color3.fromRGB(tc.R, tc.G, tc.B)
end
```

### Combine colors manually (no + operator)

```lua
local function blend(a, b)
    return Color3.new(
        math.min(1, a.R + b.R),
        math.min(1, a.G + b.G),
        math.min(1, a.B + b.B))
end
```
