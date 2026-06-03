# `audio`

Sound output: system beep, WAV playback, and a stop-all. 3 functions.

> **`PlaySound` crashes the cheat on non-WAV input.** The internal WAV loader does not validate the RIFF header before processing. Passing any non-WAV string — including an empty string or HTTP error page — triggers a native SEH exception that `pcall` cannot catch. Always verify bytes before passing to `PlaySound`.

---

## `Beep`

```lua
audio.Beep(freq_hz: number, duration_ms: number, volume?: number)
```

Windows `Beep` syscall. **Synchronous** — the script blocks for `duration_ms`. Avoid long durations on `onPaint`.

`volume` accepts any number — `0`, `0.5`, `1.0`, `2.0`, `255` all work without error. Range is unconstrained; treat `0..1` as the intended range. Strings are coerced to numbers: `audio.Beep("440", 50)` works. First two arguments are required.

```lua
-- Short alert tone
audio.Beep(880, 30)

-- Ascending two-tone
audio.Beep(400, 60)
audio.Beep(800, 60)
```

---

## `PlaySound`

```lua
audio.PlaySound(wavData: string, loop?: bool, volume?: number, pitch?: number)
```

Plays a WAV byte string asynchronously. `wavData` must be raw WAV file bytes (RIFF header + PCM).

| Arg | Range | Default |
|---|---|---|
| `loop` | bool | `false` |
| `volume` | `0..2` — `1.0` = original, `>1` = amplified | `1.0` |
| `pitch` | multiplier — `1.0` = normal speed | `1.0` |

```lua
local wav = file.read("hit.wav")
if wav and wav:sub(1, 4) == "RIFF" then
    audio.PlaySound(wav, false, 1.0, 1.0)
end
```

Always check the RIFF header before calling. `file.read` can return `nil` for a missing file, and HTTP responses can be error pages — neither is a valid WAV.

---

## `StopAll`

```lua
audio.StopAll()
```

Stops every currently playing sound. Safe no-op when nothing is playing.

```lua
cheat.register("shutdown", function()
    audio.StopAll()
end)
```

---

## Patterns

### Hit-confirm beep with cooldown

```lua
local last_beep = 0
cheat.register("onUpdate", function()
    local tgt = entity.GetTarget()
    if tgt and tgt.IsAlive then
        local now = utility.GetTickCount()
        if now - last_beep > 150 then
            audio.Beep(1200, 20)
            last_beep = now
        end
    end
end)
```

### Pre-load WAV files at startup

```lua
local SFX = {}
for _, name in ipairs({"hit", "miss", "alert"}) do
    local data = file.read(name .. ".wav")
    if data and data:sub(1, 4) == "RIFF" then
        SFX[name] = data
    end
end

local function play(name, vol)
    if SFX[name] then
        audio.PlaySound(SFX[name], false, vol or 1.0, 1.0)
    end
end
```
