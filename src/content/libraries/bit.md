# `bit`

LuaJIT BitOp library. 32-bit signed integer operations. No aliases — canonical names only (`bit.band`, `bit.bor`, etc.).

**All results are signed `int32`** (range `-2147483648..2147483647`). Inputs outside this range are truncated via `tobit` semantics before the operation.

**Shift counts are masked to `n & 31`.** `lshift(1, 32)` returns `1`, not `0`. Negative counts wrap: `lshift(1, -1)` = `lshift(1, 31)`.

---

## `band` / `bor` / `bxor`

```lua
bit.band(a, b, ...) → int32   -- AND
bit.bor (a, b, ...) → int32   -- OR
bit.bxor(a, b, ...) → int32   -- XOR
```

Variadic: `bit.band(a, b, c)` = `band(band(a, b), c)`. Single-arg form returns the input unchanged.

```lua
local flags = bit.bor(FLAG_A, FLAG_B, FLAG_C)
local low   = bit.band(value, 0xFF)
local flipped = bit.bxor(value, 0xFF)
```

---

## `bnot`

```lua
bit.bnot(a) → int32
```

Bitwise NOT. `bnot(0)` = `-1`, `bnot(0xFF)` = `-256`.

```lua
local cleared = bit.band(value, bit.bnot(MASK))
```

---

## `lshift` / `rshift` / `arshift`

```lua
bit.lshift (a, n) → int32   -- logical left (zero-fill right)
bit.rshift (a, n) → int32   -- logical right (zero-fill left)
bit.arshift(a, n) → int32   -- arithmetic right (sign-extend)
```

`rshift(-1, 1)` = `2147483647` (zero-fill). `arshift(-1, 1)` = `-1` (sign-extend).

```lua
local hi = bit.band(bit.rshift(packed, 24), 0xFF)
local lo = bit.band(packed, 0xFF)
local signed = bit.arshift(bit.lshift(byte_val, 24), 24)
```

---

## `rol` / `ror`

```lua
bit.rol(a, n) → int32   -- rotate left
bit.ror(a, n) → int32   -- rotate right
```

`rol(0x12345678, 8)` = `0x34567812`. Rotation count masked to `n & 31`.

---

## `bswap`

```lua
bit.bswap(a) → int32
```

Byte-swap a 32-bit value. `bswap(0x12345678)` = `0x78563412`. Use to convert between big-endian and little-endian.

---

## `tobit`

```lua
bit.tobit(a) → int32
```

Normalize a Lua number to `int32`. **Rounds to nearest** — `tobit(1.7)` = `2`. Use `math.floor(x)` first if you need truncation.

---

## `tohex`

```lua
bit.tohex(a, n?: number) → string
```

Hex string. Default width is 8 (lowercase). Negative `n` = uppercase.

| Call | Result |
|---|---|
| `tohex(0xABCD)` | `"0000abcd"` |
| `tohex(0xABCD, 4)` | `"abcd"` |
| `tohex(0xABCD, -4)` | `"ABCD"` |
| `tohex(-1)` | `"ffffffff"` |

---

## Patterns

### Bit flags

```lua
local function bit_test  (v, n) return bit.band(v, bit.lshift(1, n)) ~= 0 end
local function bit_set   (v, n) return bit.bor (v, bit.lshift(1, n)) end
local function bit_clear (v, n) return bit.band(v, bit.bnot(bit.lshift(1, n))) end
local function bit_toggle(v, n) return bit.bxor(v, bit.lshift(1, n)) end
```

### Pack / unpack RGBA

```lua
local function pack_rgba(r, g, b, a)
    return bit.bor(bit.lshift(r,24), bit.lshift(g,16), bit.lshift(b,8), a)
end

local function unpack_rgba(p)
    return bit.band(bit.rshift(p,24),0xFF),
           bit.band(bit.rshift(p,16),0xFF),
           bit.band(bit.rshift(p, 8),0xFF),
           bit.band(p,              0xFF)
end
```
