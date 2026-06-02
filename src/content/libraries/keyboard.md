# `keyboard`

Synthetic keyboard input and key-state query. 4 functions.

## Key names

All functions accept the same key identifiers, case-insensitive for letter names:

| Form | Example |
|---|---|
| Single letter | `"A"`, `"a"` |
| Digit | `"1"` .. `"9"` |
| Function key | `"F1"` .. `"F12"` |
| Named key | `"Space"`, `"Enter"`, `"Escape"` |
| Modifier | `"Shift"`, `"Ctrl"`, `"Alt"` — any side, not distinguished |
| Windows VK code | `0x41` (= `"A"`), `0x20` (= `"Space"`) |

**Rejected names** that raise `"Unknown key or button name"`: `"Return"` (use `"Enter"`), `"Esc"` (use `"Escape"`), `"LeftShift"`/`"RightShift"` (use `"Shift"`), `"LeftControl"` (use `"Ctrl"`), `"LeftAlt"` (use `"Alt"`), `" "` (use `"Space"`).

---

## `IsPressed`

```lua
keyboard.IsPressed(key: string | number) → bool
```

Returns `true` while the key is currently held.

```lua
cheat.register("onUpdate", function()
    if keyboard.IsPressed("Shift") and keyboard.IsPressed("E") then
        -- both held
    end
end)
```

---

## `Click`

```lua
keyboard.Click(key: string | number)
```

Synthetic press-and-release. OS-level input — reaches whichever window has focus.

```lua
keyboard.Click("Space")
```

---

## `Press` / `Release`

```lua
keyboard.Press  (key: string | number, delay_ms?: number)
keyboard.Release(key: string | number)
```

Hold a key, then release it. `delay_ms` on `Press` auto-releases after that many milliseconds. Always pair `Press` and `Release` — an unpaired press keeps the key held.

```lua
keyboard.Press("W")
-- walk forward for a bit
keyboard.Release("W")

cheat.register("shutdown", function()
    keyboard.Release("W")
end)
```

---

## Patterns

### F1 panic key

```lua
cheat.register("onUpdate", function()
    if keyboard.IsPressed("F1") then
        -- emergency action
    end
end)
```

### Throttled auto-press

```lua
local last = 0
cheat.register("onUpdate", function()
    if not keyboard.IsPressed("F2") then return end
    local now = utility.GetTickCount()
    if now - last > 250 then
        keyboard.Click("Space")
        last = now
    end
end)
```
