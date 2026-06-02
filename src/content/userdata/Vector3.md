# `Vector3`

Three-component float vector used for positions, sizes, velocities, and directions.

**`==` is identity-only** — `Vector3.new(1,2,3) == Vector3.new(1,2,3)` returns `false`. Use `:FuzzyEq` for value comparison. The pre-allocated constants (`Vector3.zero`, `.one`, `.xAxis`, `.yAxis`, `.zAxis`) are identity-equal only to themselves.

## Fields and methods

| | |
|---|---|
| **Fields** | `X`, `Y`, `Z`, `Magnitude`, `Unit` |
| **Operators** | `+`, `-`, `*scalar`, `/scalar`, unary `-` |
| **Statics** | `new`, `Dot`, `Cross`, `Lerp`, `Floor`, `Ceil`, `Abs`, `Sign`, `Min`, `Max`, `Angle`, `FuzzyEq` |
| **Constants** | `zero` (0,0,0), `one` (1,1,1), `xAxis` (1,0,0), `yAxis` (0,1,0), `zAxis` (0,0,1) |

All static functions also work as instance methods: `v:Dot(other)` = `Vector3.Dot(v, other)`.

---

## `new`

```lua
Vector3.new(x?, y?, z?) → Vector3
```

Missing arguments default to `0`. Extra arguments are silently ignored. `nil` is treated as `0`.

```lua
local up    = Vector3.new(0, 1, 0)
local point = Vector3.new(120.5, 30, -88.2)
```

---

## Operators

| Op | Example | Result |
|---|---|---|
| `a + b` | `(1,2,3) + (4,5,6)` | `(5,7,9)` |
| `a - b` | `(1,2,3) - (4,5,6)` | `(-3,-3,-3)` |
| `a * k` | `(1,2,3) * 2` | `(2,4,6)` |
| `a / k` | `(1,2,3) / 2` | `(0.5,1,1.5)` |
| `-a`    | `-(1,2,3)` | `(-1,-2,-3)` |

**`Vector3 * Vector3` silently returns `(0,0,0)`.** Use `Dot` for scalar product or multiply component-by-component manually.

---

## `Dot` / `Cross`

```lua
Vector3.Dot  (a, b) → number   -- a.X*b.X + a.Y*b.Y + a.Z*b.Z
Vector3.Cross(a, b) → Vector3  -- right-handed cross product
```

```lua
local angle = fwd:Dot(to_target.Unit)   -- cos of angle
local right = up:Cross(forward)
```

---

## `Lerp`

```lua
Vector3.Lerp(a, b, t) → Vector3
```

`t=0` returns `a`, `t=1` returns `b`. Not clamped.

```lua
local mid = start_pos:Lerp(end_pos, 0.5)
```

---

## `Floor` / `Ceil` / `Abs` / `Sign`

Component-wise math operations.

```lua
Vector3.new(-1.7, 2.3, -3.9):Floor()  -- (-2, 2, -4)
Vector3.new(-1.7, 2.3, -3.9):Ceil()   -- (-1, 3, -3)
Vector3.new(-1.7, 2.3, -3.9):Abs()    -- (1.7, 2.3, 3.9)
Vector3.new(-1.7, 0, 3.9):Sign()      -- (-1, 0, 1)
```

---

## `Min` / `Max`

```lua
Vector3.Min(a, b) → Vector3   -- component-wise minimum
Vector3.Max(a, b) → Vector3   -- component-wise maximum
```

---

## `Angle`

```lua
Vector3.Angle(a, b) → number   -- unsigned angle in radians
```

`Vector3.xAxis:Angle(Vector3.yAxis)` = `1.5707...` (π/2).

---

## `FuzzyEq`

```lua
Vector3.FuzzyEq(a, b, eps?) → bool
```

Epsilon-tolerant value equality. Use instead of `==`.

```lua
if pos:FuzzyEq(Vector3.zero) then -- effectively at origin
```

---

## Patterns

### Distance

```lua
local function dist(a, b) return (a - b).Magnitude end
```

### Smooth movement (lerp in onUpdate)

```lua
local current = Vector3.zero
local target  = Vector3.zero

cheat.register("onUpdate", function()
    current = current:Lerp(target, 0.2)
    -- set position to current
end)
```

### Component-wise multiply

```lua
local function v_scale(a, s)
    return Vector3.new(a.X*s.X, a.Y*s.Y, a.Z*s.Z)
end
```
