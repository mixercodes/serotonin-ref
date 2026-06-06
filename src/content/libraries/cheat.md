# `cheat`

Three runtime helpers: event registration, window size query, and a code-loading function. The event system is the foundation every Serotonin script is built on.

| | |
|---|---|
| **`Register`** | attach a callback to a named event |
| **`GetWindowSize`** | Roblox window pixel dimensions |
| **`LoadString`** | load and run Lua source — **broken in current builds** |

---

## `Register`

```lua
cheat.Register(event: string, callback: function)
cheat.register(event: string, callback: function)  -- alias
```

Attaches `callback` to be called whenever `event` fires. Both casing forms are available and behave identically.

### Events

| Name | Fires | Use for |
|---|---|---|
| `onPaint` | Every frame | All `draw.*` calls |
| `onUpdate` | ~10 ms | Game logic, aim, entity queries |
| `onSlowUpdate` | ~1 s | Background checks, logging |
| `shutdown` | Script unload | Cleanup, saving state |
| `newPlace` | Server/place change | Resetting cached instance refs |

Event names are case-sensitive. `"OnUpdate"`, `"ONPAINT"`, etc. are accepted without error but never fire.

### Restrictions

**Cannot be called from inside `pcall`.** Calling `cheat.register` inside a `pcall` block raises `"Cannot register callback outside of a script's main execution block."` Always register at the top level of your script.

```lua
-- WRONG — raises error at runtime
pcall(function()
    cheat.register("onUpdate", function() end)
end)

-- CORRECT — register at top level
cheat.register("onUpdate", function()
    -- your logic here
end)
```

**Callbacks cannot be unregistered.** Once registered, a callback fires for the entire script lifetime. Re-running a script stacks new callbacks on top of old ones. Guard with a flag:

```lua
if not _MY_SCRIPT_LOADED then
    _MY_SCRIPT_LOADED = true

    cheat.register("onPaint", function()
        -- runs once per frame
    end)

    cheat.register("shutdown", function()
        -- cleanup
    end)
end
```

**`_G` does not exist in the sandbox.** `_G._MY_SCRIPT_LOADED` raises an error. Use bare globals directly: `_MY_SCRIPT_LOADED = true`.

### Argument errors

| Call | Result |
|---|---|
| `Register()` | error: string expected for arg #1 |
| `Register("onUpdate")` | error: function expected for arg #2 |
| `Register("onUpdate", nil)` | error: function expected for arg #2 |
| `Register(123, fn)` | accepted silently, never fires |

---

## `GetWindowSize`

```lua
cheat.GetWindowSize() → width: number, height: number
```

Returns the Roblox window pixel size as two values. Equivalent to `draw.GetScreenSize()`.

```lua
local w, h = cheat.GetWindowSize()
```

---

## `LoadString`

```lua
cheat.LoadString(code: string, name: string)
```

Intended to compile and run Lua source. **Broken in current builds** — raises `"C++ exception"` for any valid input. `pcall` catches it (returns `ok=false, "C++ exception"`) but LoadString still always fails regardless of input.

Use standard `loadstring` instead:

```lua
local fn, err = loadstring("return 1 + 2")
if fn then print(fn()) end

-- fetch and run remote script:
http.Get("https://example.com/payload.lua", {}, function(code)
    local chunk, err = loadstring(code)
    if chunk then chunk() end
end)
```

---

## Patterns

### Idempotent script load

```lua
if not _MYSCRIPT_BOOT then
    _MYSCRIPT_BOOT = true
    cheat.register("onUpdate", function() ... end)
    cheat.register("onPaint",  function() ... end)
    cheat.register("shutdown", function() ... end)
end
```

### Window-anchored HUD

```lua
cheat.register("onPaint", function()
    local w, h = cheat.GetWindowSize()
    draw.RectFilled(w - 220, h - 80, 210, 70, Color3.new(0.08, 0.08, 0.1), 4, 220)
    draw.TextOutlined("v1.0", w - 212, h - 72, Color3.new(0.8, 0.8, 1.0), "ConsolasBold", 255)
end)
```

### Rate-limited action in onUpdate

```lua
local last_tick = 0
cheat.register("onUpdate", function()
    local now = utility.GetTickCount()
    if now - last_tick < 500 then return end
    last_tick = now
    -- runs at most every 500 ms
end)
```
