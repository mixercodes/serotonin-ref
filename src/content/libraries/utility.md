# `utility`

Time, RNG, mouse, screen projection, clipboard, and image loading. 15 functions, no required event context.

---

## `GetTickCount`

```lua
utility.GetTickCount() → int
```

Milliseconds since cheat startup. Use for cooldowns and throttles.

```lua
local last = 0
cheat.register("onUpdate", function()
    local now = utility.GetTickCount()
    if now - last < 500 then return end
    last = now
    -- fires at most every 500 ms
end)
```

---

## `GetDeltaTime`

```lua
utility.GetDeltaTime() → number
```

Seconds since the previous frame. Use for frame-rate-independent math or an FPS counter.

```lua
cheat.register("onPaint", function()
    local fps = 1 / math.max(utility.GetDeltaTime(), 0.0001)
    draw.TextOutlined(string.format("%.0f fps", fps),
        10, 10, Color3.fromRGB(255, 255, 255), "ConsolasBold", 255)
end)
```

---

## `GetSystemTime`

```lua
utility.GetSystemTime() → { year, month, day, hour, minute, second, weekday }
```

Local system time. All fields are integers. `weekday`: `0` = Sunday … `6` = Saturday.

```lua
local t = utility.GetSystemTime()
print(string.format("%04d-%02d-%02d %02d:%02d:%02d",
    t.year, t.month, t.day, t.hour, t.minute, t.second))
```

---

## `GetTimestamp`

```lua
utility.GetTimestamp() → int
```

Unix timestamp in seconds (UTC).

```lua
file.append("events.log", utility.GetTimestamp() .. " loaded\n")
```

---

## `RandomInt` / `RandomFloat`

```lua
utility.RandomInt  (a: int,    b: int)    → int
utility.RandomFloat(a: number, b: number) → number
```

Uniform random in the inclusive range `[a, b]`.

```lua
local roll   = utility.RandomInt(1, 100)
local jitter = utility.RandomFloat(-0.5, 0.5)
```

---

## `GetMousePos`

```lua
utility.GetMousePos() → table { [1]=x, [2]=y }
```

Current cursor position in screen pixels. Returns a **single table**, not multi-return — access as `mp[1]` and `mp[2]`. There is no `.X` / `.Y` shortcut, and the table does not unpack into `local x, y = ...`.

```lua
local mp = utility.GetMousePos()
local mx, my = mp[1], mp[2]
draw.Circle(mx, my, 6, Color3.fromRGB(255, 255, 0), 1, 12, 255)
```

---

## `MoveMouse`

```lua
utility.MoveMouse(dx: int, dy: int)
```

Moves the cursor by a relative offset. **Not raw pixels** — Windows pointer ballistics apply, so a `dx=30` call may move more than 30 pixels depending on system sensitivity. For smooth aim use tiny incremental steps (1–3 units) where the curve is closer to linear.

Do not call from `onPaint`. Use `onUpdate` with rate limiting.

---

## `GetMenuState`

```lua
utility.GetMenuState() → bool
```

Returns `true` when the Serotonin menu is open. Gate aim or automation logic on this to avoid unintended actions while the user has the menu open.

```lua
cheat.register("onUpdate", function()
    if utility.GetMenuState() then return end
    -- aim logic
end)
```

---

## `WorldToScreen`

```lua
utility.WorldToScreen(v3: Vector3) → screenX, screenY, onScreen: bool
```

Projects a world-space `Vector3` to 2D screen coordinates. Returns three values. `onScreen` is `true` when the projection is mathematically valid (the point is in front of the camera) — it is **not** a screen-bounds check. To check visibility within the window, additionally test `0 <= screenX <= w` and `0 <= screenY <= h`.

Must receive a `Vector3` userdata — plain tables are rejected.

```lua
cheat.register("onPaint", function()
    local me = entity.GetLocalPlayer()
    if not me then return end
    local pos = me:GetBonePosition("HumanoidRootPart")
    if not pos then return end
    local x, y, on = utility.WorldToScreen(pos)
    if on then
        draw.TextOutlined("ME", x, y, Color3.fromRGB(0, 255, 0), "Verdana", 255)
    end
end)
```

---

## `GetClipboard` / `SetClipboard`

```lua
utility.GetClipboard() → string
utility.SetClipboard(s: string)
```

Read or replace the system clipboard. `GetClipboard` returns an empty string for non-text content. `SetClipboard` overwrites whatever the user had copied.

```lua
local me = entity.GetLocalPlayer()
if me then
    utility.SetClipboard(tostring(me.UserId))
end
```

---

## `LoadImage`

```lua
utility.LoadImage(data: string) → number
```

Loads raw PNG or JPG bytes into a texture and returns a numeric id for `draw.Image`. **Each call allocates a new texture handle** — call once at startup, not per-frame.

```lua
local data = file.read("logo.png")
if data then
    local tex = utility.LoadImage(data)
    cheat.register("onPaint", function()
        draw.Image(tex, 20, 20, 64, 64)
    end)
end
```

Images live in `C:\Serotonin\files\` (the sandbox root). Reference them by filename: `file.read("logo.png")`.

---

## `GetFingerprint`

```lua
utility.GetFingerprint() → string
```

Hardware fingerprint hash for per-machine config files. Returns an empty string `""` in current builds — always check and provide a fallback.

```lua
local fp = utility.GetFingerprint()
if not fp or fp == "" then fp = "anon" end
```

---

## `TeleportToPlace`

```lua
utility.TeleportToPlace(jobId: string)
```

Joins a specific server instance by its Job ID (UUID). This stays in the same game — it is a server-switch, not a game-switch. An invalid Job ID can still trigger a failed teleport attempt that may disconnect you.

---

## Patterns

### Throttled action (every N ms)

```lua
local next_run = 0
cheat.register("onUpdate", function()
    local t = utility.GetTickCount()
    if t < next_run then return end
    next_run = t + 1000
    -- runs every ~1 s
end)
```

### Per-machine config path

```lua
local fp = utility.GetFingerprint()
if not fp or fp == "" then fp = "default" end
local cfg_path = "config_" .. string.sub(fp, 1, 8) .. ".json"
```
