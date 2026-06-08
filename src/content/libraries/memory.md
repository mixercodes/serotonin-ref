# `memory`

Direct access to the Roblox process address space. Read typed values, write them back, scan for byte patterns, and validate addresses before use. 6 functions.

> [!CAUTION]
> **`Write` is documented but not roundtrip-tested.** A wrong address or type can corrupt Roblox state. Gate every write with `IsValid` and a read-back sanity check.

## Supported types

17 accepted type strings, verified live. Every other variant raises `"Invalid memory type for read: '<name>'"`.

| Type | Width | Notes |
|---|---|---|
| `byte` | 1 | unsigned |
| `short` | 2 | signed |
| `ushort` | 2 | unsigned |
| `int` | 4 | signed |
| `uint` | 4 | unsigned |
| `int64` | 8 | signed |
| `uint64` | 8 | unsigned |
| `float` | 4 | IEEE 754 |
| `double` | 8 | IEEE 754 |
| `bool` | 1 | non-zero = true |
| `string` | variable | NUL-terminated C string |
| `ptr` / `pointer` | 8 | 8-byte pointer (aliases) |
| `vector2` | 8 | returns Vector2 userdata |
| `vector3` | 12 | returns Vector3 userdata |
| `color3` | 12 | returns a single **Color3 userdata** (3×4-byte floats, channels 0..1). Access as `c.R`, `c.G`, `c.B` — **not** multi-return |
| `cframe` | — | returns a table |

Common names that do **not** work: `dword` (use `uint`), `qword` (use `uint64`), `long`/`longlong` (use `int64`), `int8/16/32`, `uint8/16/32`.

---

## `GetBase`

```lua
memory.GetBase() → number
```

Base virtual address of the Roblox executable. Changes each launch (ASLR). The first two bytes at this address are always `0x4D 0x5A` (the `MZ` PE signature).

```lua
local base = memory.GetBase()
print(string.format("base: 0x%X", base))
```

---

## `Rebase`

```lua
memory.Rebase(offset: number) → number
```

Returns `GetBase() + offset`. Converts a static analysis offset (from IDA/Ghidra) to a runtime address.

```lua
local addr = memory.Rebase(0x12340)
```

---

## `IsValid`

```lua
memory.IsValid(addr: number) → bool
```

Returns `true` if `addr` is within a readable virtual memory page. Always call this before dereferencing a pointer chain.

```lua
if memory.IsValid(addr) then
    local v = memory.Read("int", addr)
end
```

---

## `Read`

```lua
memory.Read(type: string, addr: number) → value
```

Typed read at `addr`. For `color3`, capture a single Color3 userdata — it does **not** multi-return three values:

```lua
local c = memory.Read("color3", addr)
local r, g, b = c.R, c.G, c.B   -- channels are 0..1 floats
```

```lua
local base  = memory.GetBase()
local magic = memory.Read("short", base)   -- 23117 = 0x5A4D = "MZ"
local b1    = memory.Read("byte",  base)   -- 77 = 'M'
```

---

## `Write`

```lua
memory.Write(type: string, addr: number, value)
```

Typed write. Same 17 type strings as `Read`. Crashes the game on a bad address — always guard:

```lua
if memory.IsValid(addr) then
    local before = memory.Read("int", addr)
    memory.Write("int", addr, new_value)
    local after = memory.Read("int", addr)
end
```

---

## `Scan`

```lua
memory.Scan(pattern: string) → number | nil
```

AOB pattern scan. **Single-argument form only** — returns the first match address as a number, or `nil` if not found. Space-separated hex bytes, `??` as wildcard.

**Range form and callback form crash the engine.** Only the single-argument signature is safe:

| Form | Safe? |
|---|---|
| `memory.Scan(pattern)` | Safe when pattern matches quickly |
| `memory.Scan(pattern, start, end)` | **Crashes** |
| `memory.Scan(pattern, callback)` | **Crashes** |

**A pattern that doesn't match also crashes.** The scan walks the full address space until it finds a match or runs out of memory — a rare or absent pattern causes a timeout/crash. Only scan for patterns you're confident exist in the process.

```lua
local addr = memory.Scan("90 ?? 90")
if addr and memory.IsValid(addr) then
    local val = memory.Read("byte", addr)
end

-- RIP-relative pointer resolution
local addr = memory.Scan("48 8B 05 ?? ?? ?? ?? 48 8B 88")
if addr and memory.IsValid(addr) then
    local disp   = memory.Read("int", addr + 3)
    local target = addr + 7 + disp
end
```

---

## Patterns

### Walk a pointer chain

```lua
local function follow(addr, offsets)
    for _, off in ipairs(offsets) do
        if not memory.IsValid(addr) then return nil end
        addr = memory.Read("ptr", addr) + off
    end
    return addr
end

local final = follow(memory.Rebase(0x12340), {0x10, 0x28, 0x0})
if final and memory.IsValid(final) then
    local val = memory.Read("float", final)
end
```

### Sign-extend with `bit`

```lua
local raw = memory.Read("byte", addr)
local signed = bit.arshift(bit.lshift(raw, 24), 24)
```
