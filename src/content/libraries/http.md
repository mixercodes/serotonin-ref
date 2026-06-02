# `http`

Asynchronous HTTPS client. 2 functions. Both return `nil` immediately — responses arrive via callback on a later cheat tick.

**No status code or headers.** The callback receives only the response body as a string. You cannot read the HTTP status or response headers.

**Network failures are silent.** An unreachable host or DNS failure causes the callback to never fire. Add your own timeout if you need failure detection.

---

## `Get`

```lua
http.Get(url: string, headers: table, callback: function)
```

All three arguments are required — pass `{}` for no custom headers. The callback receives the response body as a string.

```lua
http.Get("https://api.example.com/status", {
    ["Authorization"] = "Bearer " .. token,
}, function(body)
    if body then print("got", #body, "bytes") end
end)
```

### Timeout pattern

```lua
local fired = false
local deadline = utility.GetTickCount() + 5000

http.Get(url, {}, function(body)
    fired = true
    handle(body)
end)

cheat.register("onUpdate", function()
    if not fired and utility.GetTickCount() > deadline then
        fired = true
        handle(nil)  -- timed out
    end
end)
```

---

## `Post`

```lua
http.Post(url: string, headers: table, body: string, callback: function)
```

All four arguments are required. Set `Content-Type` yourself — without it, servers may interpret the body as form data.

```lua
local payload = '{"event":"hit","ts":' .. utility.GetTickCount() .. '}'
http.Post("https://your-server/log", {
    ["Content-Type"] = "application/json",
}, payload, function(resp)
    -- resp is the response body, or nil on timeout
end)
```

---

## Patterns

### Fetch and run remote Lua

```lua
http.Get("https://your-cdn/payload.lua", {}, function(code)
    if code and #code > 0 then
        local fn, err = loadstring(code)
        if fn then fn() else print("compile error:", err) end
    end
end)
```

### Batch telemetry via onSlowUpdate

```lua
local queue = {}

local function log_event(line)
    queue[#queue + 1] = string.format("[%d] %s", utility.GetTickCount(), line)
end

cheat.register("onSlowUpdate", function()
    if #queue == 0 then return end
    local body = table.concat(queue, "\n")
    queue = {}
    http.Post("https://your-server/telemetry",
        {["Content-Type"] = "text/plain"}, body, function() end)
end)
```

### Download and play a WAV

```lua
http.Get("https://your-cdn/hit.wav", {}, function(body)
    if body and body:sub(1, 4) == "RIFF" then
        audio.PlaySound(body, false, 1.0, 1.0)
    end
end)
```
