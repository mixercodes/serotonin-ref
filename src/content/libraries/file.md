# `file`

Sandboxed filesystem access. 8 functions, **lowercase-canonical** (no PascalCase aliases).

**Sandbox root:** `C:\Serotonin\files\` — relative paths resolve here, not relative to scripts.  
**Binary-safe:** `read`/`write` preserve every byte including null bytes.  
**`..` is blocked:** `file.read("../scripts/foo.lua")` raises `"File path cannot contain '..'"`

---

## `read`

```lua
file.read(path: string) → string | nil
```

Returns the full file contents or `nil` for a missing file. No error on miss.

```lua
local cfg = file.read("config.json")
if cfg then
    -- parse cfg
end
```

---

## `write`

```lua
file.write(path: string, content: string) → bool
```

Overwrites the file. Returns `true` on success, `false` when the parent directory is missing. **Does not create parent directories** — use `mkdir` first.

```lua
file.mkdir("logs")
file.write("logs/run.log", "started")
```

---

## `append`

```lua
file.append(path: string, content: string) → bool
```

Appends to the file, creating it if it does not exist. Unlike `write`, this does not require the parent directory to exist for flat paths.

```lua
local function log(line)
    file.append("session.log",
        string.format("[%d] %s\n", utility.GetTickCount(), line))
end
cheat.register("onSlowUpdate", function() log("heartbeat") end)
```

---

## `delete`

```lua
file.delete(path: string) → bool
```

Deletes a file or **empty** directory. Returns `false` for non-empty directories or missing paths (no error).

---

## `exists`

```lua
file.exists(path: string) → bool
```

True if anything (file or directory) is at the path. `""` = sandbox root, always `true`.

---

## `isdir`

```lua
file.isdir(path: string) → bool
```

True only if the path exists and is a directory.

---

## `mkdir`

```lua
file.mkdir(path: string) → bool
```

Creates a directory. **Recursive** — `mkdir("a/b/c")` creates all three levels. **Idempotent** — returns `true` if the directory already exists.

---

## `listdir`

```lua
file.listdir(path?: string) → table | nil
```

Lists a directory. Omit `path` or pass `""` for the sandbox root. Returns `nil` for a missing path or a file.

Each entry:

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | basename only |
| `isDirectory` | `bool` | |
| `isFile` | `bool` | |
| `size` | `number` | only present when `isFile == true` |

```lua
for _, e in ipairs(file.listdir("logs") or {}) do
    if e.isFile then
        print(e.name, e.size, "bytes")
    end
end
```

---

## Patterns

### Read-or-default

```lua
local function read_or(path, default)
    return file.read(path) or default
end
local cfg = read_or("settings.json", "{}")
```

### Safe write with tmp file

```lua
local function safe_write(path, data)
    local tmp = path .. ".tmp"
    if file.write(tmp, data) then
        file.delete(path)
        if file.write(path, data) then
            file.delete(tmp)
            return true
        end
    end
    return false
end
```

### Recursive delete

```lua
local function rm_rf(path)
    if file.isdir(path) then
        for _, e in ipairs(file.listdir(path) or {}) do
            rm_rf(path .. "/" .. e.name)
        end
    end
    file.delete(path)
end
```

### Log with size cap

```lua
local LOG, MAX = "session.log", 1024 * 1024

local function log(line)
    local entries = file.listdir("") or {}
    for _, e in ipairs(entries) do
        if e.name == LOG and e.isFile and e.size > MAX then
            local old = file.read(LOG)
            file.delete(LOG)
            if old then file.write(LOG .. ".old", old) end
            break
        end
    end
    file.append(LOG, string.format("[%d] %s\n", utility.GetTickCount(), line))
end
```
