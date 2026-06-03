# Crash triggers

Calls that trigger native SEH exceptions inside the Serotonin DLL. `pcall` does **not** catch these — the cheat process goes down.

## Confirmed crashers

`pcall` does **not** catch these — the cheat process goes down.

| Trigger | Notes |
|---|---|
| `audio.PlaySound(non-WAV)` | RIFF header is not validated before parsing. Empty string, short garbage, HTTP error pages — all crash. Always check `data:sub(1, 4) == "RIFF"` first |
| `cheat.LoadString(code, name)` | Every 2-arg invocation raises an uncatchable `"C++ exception"`. Use standard `loadstring()` instead |
| `memory.Scan(pattern, start, end)` or `memory.Scan(pattern, callback)` | **Crashes** — only the single-arg form is safe |
| `memory.Scan(pattern)` with a rare or absent pattern | **Crashes** — walks the full address space until match or OOM; only scan for patterns known to exist |
| Any `draw.*` primitive outside `onPaint` | C++ exception. Safe outside `onPaint`: `GetTextSize`, `GetScreenSize`, `GetPartCorners`, `ComputeConvexHull` |
| `draw.Text` / `draw.TextOutlined` with 7+ args | Extra size argument crashes — no size override exists |
| `draw.Gradient` with 8+ args | 8th argument not supported |
| `draw.Polyline({}, ...)` | Empty point table crashes |
| `draw.GetMesh(non-MeshPart)` | C++ exception |
| `cheat.register` inside `pcall` | Runtime error: cannot register outside main execution block |
| Concurrent cheat calls | The sandbox is not thread-safe |

## Sandbox notes

| Call | Behaviour |
|---|---|
| `_G` | Does not exist in the sandbox — `type(_G)` returns `"nil"`. Use bare globals or `getfenv(1)` |
| `game.DataModel` | Returns userdata |
| `game.LocalPlayer.Backpack` | Accessible |
| `game.PlaceID` | Returns the place ID |
| `Color3:ToHSV()` | Returns `h, s, v` multi-return cleanly |
| `game.GetFFlag` / `game.SetFFlag` | Safe — type must be `"int"`, `"bool"`, `"float"`, or `"double"` |
| `Workspace:GetDescendants()` on large trees | Does not crash — performance cost scales with tree size |

## Performance considerations

These won't crash but will cause visible frame drops if not throttled:

| Pattern | Mitigation |
|---|---|
| `entity.GetPlayers()` loop with per-player bone reads | Throttle to 30–60 Hz |
| `memory.Write` in `onUpdate` at high frequency | Rate-limit to ~2 Hz |

## If you hit a new crasher

1. Note the exact call that triggered it
2. Don't repeat it
3. Guard or remove from your script
4. Restart Serotonin before continuing
