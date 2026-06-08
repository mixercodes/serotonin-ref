# `ui`

Cheat menu builder. Creates tabs, containers, and widgets that persist for the script's lifetime. 16 functions: 12 builders and 4 state operations.

Every widget is addressed by a `(tab, container, label)` triple in `GetValue` / `SetValue` / `SetVisibility`.

## Widget layout

```
NewTab("MY_TAB", "My Script")
    └── NewContainer("MY_TAB", "MY_CON", "Settings")
            ├── NewCheckbox(...)
            ├── NewColorpicker(..., {r,g,b,a}, true)  -- inline after checkbox
            ├── NewSliderInt(...)
            └── NewHotkey(..., true)                  -- inline after checkbox
```

> [!WARNING]
> **Tab and container IDs must differ from their labels.** `ui.NewTab("Settings", "Settings")` renders the tab twice. Use a short opaque key as the ID and a human-readable string as the label: `ui.NewTab("myscript_tab", "My Script")`.

> [!WARNING]
> **No unregister API.** Widgets persist until the script unloads. Re-running a script without restarting stacks new callbacks on top. Guard with `_ALREADY_LOADED`.

## Value types by widget

| Widget | `GetValue` returns | `SetValue` accepts |
|---|---|---|
| `NewCheckbox` | `bool` | `bool` |
| `NewButton` | `nil` | n/a (use the callback) |
| `NewSliderInt` | `number` (integer) | `number` |
| `NewSliderFloat` | `number` | `number` |
| `NewInputText` | `string` | `string` |
| `NewDropdown` | `number` — **0-based index** (`0` = first option, `1` = second, …) | `number` (0-based) |
| `NewListbox` | `number` — same 0-based shape as Dropdown | `number` (0-based) |
| `NewMultiselect` | `table {[1]=bool, [2]=bool, …}` | `table` of bools |
| `NewColorpicker` | `table {r, g, b, a}` (integers 0–255) | `table {r=, g=, b=, a=}` — **not** `Color3` |
| `NewHotkey` | `bool` (true while bound key is held) | `number` (Windows VK code) |

> [!NOTE]
> **Dropdown `GetValue` and `SetValue` are 0-based.** `GetValue` returns `0` for the first option, `1` for the second, and so on. `SetValue` takes a 0-based index. **The `default` 5th argument to `NewDropdown` is 1-based**: pass `1` for the first item, `2` for the second; omit for the first item. Passing `0` results in `GetValue = -1` (undefined — avoid).

---

## `NewTab` / `NewContainer`

```lua
ui.NewTab      (tab: string, label: string)
ui.NewContainer(tab: string, container: string, label: string, opts?: table)
```

Both arguments to `NewTab` are required. `NewContainer` accepts an optional table — `{ autosize = true }` sizes the container to fit its contents, `{ autosize = true, next = true }` places it side-by-side with the previous container.

```lua
local TAB = "myscript_main"
local CON = "myscript_settings"

ui.NewTab(TAB, "My Script")
ui.NewContainer(TAB, CON, "Settings", { autosize = true })
```

---

## `NewCheckbox`

```lua
ui.NewCheckbox(tab, container, label) → id
```

Boolean toggle, defaults to `false`.

```lua
ui.NewCheckbox("MY_TAB", "MY_CON", "Enable ESP")
```

---

## `NewButton`

```lua
ui.NewButton(tab, container, label, callback: function) → id
```

The callback argument is required — omitting it raises an error. `GetValue` on a button returns `nil`.

```lua
ui.NewButton("MY_TAB", "MY_CON", "Reset", function()
    file.delete("settings.json")
end)
```

---

## `NewSliderInt` / `NewSliderFloat`

```lua
ui.NewSliderInt  (tab, container, label, min, max) → id
ui.NewSliderFloat(tab, container, label, min, max) → id
```

Default value is `min`. Set defaults after creation via `SetValue`.

```lua
ui.NewSliderInt  ("MY_TAB", "MY_CON", "FOV",       0,   180)
ui.NewSliderFloat("MY_TAB", "MY_CON", "Smoothing", 0.0, 1.0)
ui.SetValue("MY_TAB", "MY_CON", "FOV", 90)
```

---

## `NewInputText`

```lua
ui.NewInputText(tab, container, label) → id
```

Single-line text field, defaults to `""`.

---

## `NewDropdown` / `NewListbox`

```lua
ui.NewDropdown(tab, container, label, options: table, default?: number) → id
ui.NewListbox (tab, container, label, options: table) → id
```

`options` is a Lua array of strings. `GetValue` and `SetValue` use **0-based** indices (`0` = first option). The `default` 5th argument is **1-based**: `1` = first item, `2` = second; omit to default to the first item. Passing `0` gives `GetValue = -1` (no selection — avoid).

```lua
local MODES = { "Off", "Silent", "Legit" }
ui.NewDropdown("MY_TAB", "MY_CON", "Mode", MODES, 1)  -- default: "Off" (first item; 5th arg is 1-based)

-- Read:
local idx  = ui.GetValue("MY_TAB", "MY_CON", "Mode")
local mode = MODES[idx + 1]  -- +1 because Lua tables are 1-based
```

---

## `NewMultiselect`

```lua
ui.NewMultiselect(tab, container, label, options: table) → id
```

Multi-select widget. `GetValue` returns a table with one `bool` per position (1-based Lua table).

```lua
ui.NewMultiselect("MY_TAB", "MY_CON", "Show", {"Boxes","Names","HP"})
local sel = ui.GetValue("MY_TAB", "MY_CON", "Show")
if sel[1] then -- boxes on
```

---

## `NewColorpicker`

```lua
ui.NewColorpicker(tab, container, label, default?: table, inLine?: bool) → id
```

RGBA color picker. `default` is `{ r=255, g=255, b=255, a=255 }` if omitted. `inLine = true` attaches the picker inline on the same row as the widget declared immediately before it — used to pair colors with checkboxes.

`GetValue` returns `{ r=int, g=int, b=int, a=int }` (0–255). `SetValue` expects the same table shape — **not a `Color3`**.

```lua
ui.NewCheckbox   ("MY_TAB", "MY_CON", "Box ESP")
ui.NewColorpicker("MY_TAB", "MY_CON", "Box Color", {r=255, g=80, b=80, a=255}, true)

-- Read in onPaint:
local c = ui.GetValue("MY_TAB", "MY_CON", "Box Color")
local color = Color3.fromRGB(c.r, c.g, c.b)
```

---

## `NewHotkey`

```lua
ui.NewHotkey(tab, container, label, inLine?: bool) → id
```

Key binding widget. `inLine = true` places it on the same row as the preceding widget (typically a checkbox). `GetValue` returns `true` while the bound key is held.

| Key | VK code |
|---|---|
| A–Z | `0x41`–`0x5A` |
| F1–F12 | `0x70`–`0x7B` |
| Space | `0x20` |
| LMB / RMB / MMB | `0x01` / `0x02` / `0x04` |

```lua
ui.NewCheckbox("MY_TAB", "MY_CON", "Aim Assist")
ui.NewHotkey  ("MY_TAB", "MY_CON", "Aim Key", true)
ui.SetValue   ("MY_TAB", "MY_CON", "Aim Key", 0x70)  -- default F1

cheat.register("onUpdate", function()
    local on  = ui.GetValue("MY_TAB", "MY_CON", "Aim Assist")
    local key = ui.GetValue("MY_TAB", "MY_CON", "Aim Key")
    if on and key then
        -- aim logic here
    end
end)
```

For single-press (edge) detection rather than held state:

```lua
local hk_prev = {}
local function hotkey_clicked(label)
    local now  = ui.GetValue("MY_TAB", "MY_CON", label)
    local edge = now and not (hk_prev[label] or false)
    hk_prev[label] = now
    return edge
end
```

---

## `GetValue` / `SetValue`

```lua
ui.GetValue(tab, container, label) → any
ui.SetValue(tab, container, label, value)
```

Type mismatches raise Lua errors (e.g. passing a string to a slider). Passing a `Color3` to a colorpicker is silently accepted but does nothing — always use the `{r,g,b,a}` table form.

---

## `GetHotkey`

```lua
ui.GetHotkey(tab, container, label) → { key, key_name, mode }
```

Returns the current binding. Default for a freshly created hotkey: `{ key=0, key_name="Unbound", mode=0 }`.

---

## `SetVisibility`

```lua
ui.SetVisibility(tab, container, label, visible: bool)
```

Shows or hides a widget. Drive from a dedicated `onUpdate` callback, not from game logic or hotkey hold state (hotkey hold state fires every 5ms and causes flickering).

```lua
-- At load — hide sub-widgets until master checkbox is on
ui.SetVisibility("MY_TAB", "MY_CON", "FOV",      false)
ui.SetVisibility("MY_TAB", "MY_CON", "Aim Key",  false)

-- Dedicated visibility callback
cheat.register("onUpdate", function()
    local on = ui.GetValue("MY_TAB", "MY_CON", "Aim Assist")
    ui.SetVisibility("MY_TAB", "MY_CON", "FOV",     on)
    ui.SetVisibility("MY_TAB", "MY_CON", "Aim Key", on)
end)
```

---

## Patterns

### Script bootstrap guard

```lua
local TAB = "myscript_tab"
local CON = "myscript_main"

if not _MYSCRIPT_LOADED then
    _MYSCRIPT_LOADED = true

    ui.NewTab(TAB, "My Script")
    ui.NewContainer(TAB, CON, "Settings", { autosize = true })

    ui.NewCheckbox   (TAB, CON, "Box ESP")
    ui.NewColorpicker(TAB, CON, "Box Color", {r=255, g=80, b=80, a=255}, true)
    ui.NewSliderFloat(TAB, CON, "Thickness", 0.5, 4.0)
    ui.NewCheckbox   (TAB, CON, "Name ESP")
    ui.NewHotkey     (TAB, CON, "Toggle", true)

    -- hide extras until master is on
    ui.SetVisibility(TAB, CON, "Thickness", false)

    cheat.register("onUpdate", function()
        local on = ui.GetValue(TAB, CON, "Box ESP")
        ui.SetVisibility(TAB, CON, "Thickness", on)
    end)
end
```

### Read dropdown correctly (0-based)

```lua
local BONES = { "Head", "UpperTorso", "HumanoidRootPart" }
ui.NewDropdown(TAB, CON, "Target Bone", BONES, 1)  -- default "Head" (first item; 5th arg is 1-based)

cheat.register("onUpdate", function()
    local idx  = ui.GetValue(TAB, CON, "Target Bone")
    local bone = BONES[idx + 1]  -- convert 0-based to 1-based Lua index
    -- use bone name...
end)
```

### Persist UI state to disk

```lua
local function save()
    local c = ui.GetValue(TAB, CON, "Box Color")
    file.write("settings.json", string.format(
        '{"r":%d,"g":%d,"b":%d,"a":%d}', c.r, c.g, c.b, c.a))
end

ui.NewButton(TAB, CON, "Save", save)
cheat.register("shutdown", save)
```
