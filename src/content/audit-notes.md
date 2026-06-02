# How this reference was built

Every page is the result of live probing against a running Serotonin build. If a page exists, every function on it has been roundtripped against the runtime.

## Process

**1. Enumerate what actually exists.** A Lua script walks `getfenv(0)`, classifies every binding, and enumerates each table's keys. For userdata (Vector3, Color3, Roblox instances, player objects) it probes candidate field names by name since `pairs()` returns nothing useful on userdata with `__index` functions. The output is a JSON snapshot. Re-running after a build update produces a clean diff.

**2. Probe each function the same way.** For every canonical function:
- Existence: `type(lib.Function) == "function"`
- Argument shape: call with no args, then `nil`, then progressively more args and capture error text verbatim
- Valid call: concrete inputs, capture return types, multi-return count via `select("#", ...)`
- Edge cases: out-of-range inputs, empty strings, type mismatches
- Working example from real script code

**3. Roundtrip side-effecting functions.** For things like `mouse.Press`/`Release`, the full state cycle (`IsPressed` before/during/after) is confirmed. For `ui.SetValue`/`GetValue`, every widget type is roundtripped to catch the surprising formats (dropdown is 0-based index, colorpicker takes `{r,g,b,a}` table not `Color3`, etc.).

**4. Runtime is the authority.** If observed behaviour differs from any other source, runtime wins.

## Key findings

- **Draw alpha is 0–255 integers, not 0..1 floats.** Every `draw.*` primitive treats the alpha argument as a byte. Passing `1.0` renders at 1/255 opacity — effectively invisible.
- **`entity.GetPlayers(false)` excludes the local player.** Use `entity.GetLocalPlayer()` for yourself.
- **`p.IsVisible` is always `false`.** Confirmed across 12 live players. Non-functional as a wall check.
- **`GetBonePosition` can return nil.** Not just zero-vector. Always guard with `if not b then`.
- **Entity bone cache only covers enemies.** Teammates return zero from `GetBonePosition`. Fall back to workspace for teammate positions.
- **Dropdown and listbox `GetValue` returns 0-based index** (`0` = first option).
- **`ui.NewColorpicker` full signature:** `(tab, container, label, defaultColor, inLine)` — 4th arg is default `{r,g,b,a}` table, 5th is inline flag.
- **`cheat.register` cannot be called from inside `pcall`.**
- **`_G` does not exist in the sandbox.** Use bare globals directly.
- **`game.GetService("Players").LocalPlayer` is nil.** Use `game.LocalPlayer` or `entity.GetLocalPlayer()`.
