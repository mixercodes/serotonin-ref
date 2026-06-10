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
| `_G` | Does not exist in the sandbox — `type(_G)` returns `"nil"`. Use bare globals or `getfenv(1)`; bare globals persist across `eval`/`loadstring` chunks |
| `cheat.register` from `eval`/`loadstring` contexts | Raises *"Cannot register callback outside of a script's main execution block."* even when called directly. Workaround: stub-capture — see [Agent](/docs/tools/agent) |
| No `cheat.Unregister` | Callbacks can never be removed. Use a generation guard: `_GEN = (_GEN or 0) + 1` at load, capture it, and have every callback no-op when superseded |
| `inst:GetAttributes()` | Returns an **array** of `{Name, TypeName, Value}` tables, not the standard flat dict — iterate and match `attr.Name` |
| `p:GetBonePosition(bone)` | Can return **nil** (not just the documented zero-vector) — guard before indexing `.X` |
| `MeshPart.TextureId` | Often stale or empty when a `SurfaceAppearance` child exists — the engine renders the SurfaceAppearance ColorMap instead. See [surfaces & decals](/docs/roblox/surfaces-decals) |
| Negative `SpecialMesh.Scale` components | Legitimate (mirrored meshes, inside-out skydomes) — clamp magnitude only, never the sign. See [classic meshes](/docs/roblox/classic-meshes) |
| Exporting v1 `.mesh` assets | v1.00 vertices are stored doubled and v1.00/1.01 store V upside down — see [mesh formats](/docs/roblox/mesh-formats) |
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
