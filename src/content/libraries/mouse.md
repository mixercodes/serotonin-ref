# `mouse`

Synthetic mouse input and button-state query. 5 functions.

Cursor position is in [`utility.GetMousePos`](./utility#getmousepos) and [`utility.MoveMouse`](./utility#movemouse) — this library has no `GetPos`/`SetPos`.

## Button identifier split

The button argument is accepted differently depending on which function you call.

**`IsClicked`** accepts numeric codes and specific lowercase strings. **String matching is case-sensitive.**

| Form | Works? | Notes |
|---|---|---|
| `1` | ✓ | LMB |
| `2` | ✓ | RMB |
| `4` | unverified | MMB (no crash, but not confirmed held) |
| `"mouse4"` | ✓ | X1 side button — lowercase only |
| `"mouse5"` | ✓ | X2 side button — lowercase only |
| `"Mouse4"` / `"Mouse5"` | ✗ | Case-sensitive — returns `false` silently |
| `"left"` / `"right"` | ✗ | **Silently broken** — always `false` even when held |
| `"middle"` / `"xbutton1"` / `"xbutton2"` | ✗ | Crash: `"Unknown key or button name"` |

**`Click` / `Press` / `Release`** only accept numeric VK codes and `"mouse4"` / `"mouse5"`:

| Value | Button |
|---|---|
| `1` | LMB |
| `2` | RMB |
| `4` | MMB |
| `5` / `"mouse4"` | Side X1 |
| `6` / `"mouse5"` | Side X2 |

Passing `"left"` or `"right"` to `Click` / `Press` / `Release` raises `"Invalid mouse button specified"`. Define constants once:

```lua
local MB = { LEFT=1, RIGHT=2, MIDDLE=4, X1=5, X2=6 }
```

---

## `IsClicked`

```lua
mouse.IsClicked(button: string | number) → bool
```

Returns `true` while the button is currently held.

```lua
cheat.register("onUpdate", function()
    if mouse.IsClicked(1) then   -- use numeric 1 for LMB; "left" string is broken
        -- LMB held
    end
end)
```

---

## `Click`

```lua
mouse.Click(button: number | "mouse4" | "mouse5", delay_ms?: number)
```

Synthetic press-and-release. `delay_ms` inserts a gap between the press and release (default ~0). Delivered as OS-level input — hits whichever window has focus.

```lua
mouse.Click(MB.LEFT)
mouse.Click(MB.LEFT, 50)  -- 50 ms hold
```

---

## `Press` / `Release`

```lua
mouse.Press  (button: number | "mouse4" | "mouse5")
mouse.Release(button: number | "mouse4" | "mouse5")
```

Hold a button down, then lift it. Always pair them — an unpaired `Press` keeps the button held until the next real OS event.

```lua
mouse.Press(MB.RIGHT)
-- ... aim logic ...
mouse.Release(MB.RIGHT)

-- always release on unload
cheat.register("shutdown", function()
    mouse.Release(MB.LEFT)
    mouse.Release(MB.RIGHT)
end)
```

---

## `Scroll`

```lua
mouse.Scroll(amount: number)
```

Wheel scroll. Positive = up, negative = down. A single notch is conventionally `120`.

```lua
mouse.Scroll(120)   -- one notch up
mouse.Scroll(-360)  -- three notches down
```

---

## Patterns

### Triggerbot with cooldown

```lua
local last_click = 0
cheat.register("onUpdate", function()
    if utility.GetMenuState() then return end
    local tgt = entity.GetTarget()
    if not tgt or not tgt.IsAlive or not tgt.IsEnemy then return end
    local now = utility.GetTickCount()
    if now - last_click > 200 then
        mouse.Click(MB.LEFT)
        last_click = now
    end
end)
```

### Hold LMB while target is valid

```lua
local holding = false
cheat.register("onUpdate", function()
    local want = entity.GetTarget() ~= nil
    if want and not holding then
        mouse.Press(MB.LEFT); holding = true
    elseif not want and holding then
        mouse.Release(MB.LEFT); holding = false
    end
end)
cheat.register("shutdown", function()
    if holding then mouse.Release(MB.LEFT) end
end)
```
