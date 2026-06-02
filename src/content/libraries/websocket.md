# `websocket`

Asynchronous WebSocket client. 3 functions. Connections are identified by a numeric id returned by `Connect`.

**Callback keys are camelCase only.** `onOpen`, `onMessage`, `onClose`, `onError`. PascalCase and snake_case keys are silently ignored — verified live: only the camelCase table received the `onError` event.

**Failures are async.** `Connect` always returns an id immediately, even for an invalid URL. The failure surfaces as an `onError` callback later.

---

## `Connect`

```lua
websocket.Connect(url: string, callbacks: table) → id: number
```

Both arguments required. Returns a sequential numeric id. IDs start at 1 and increment per call in the session.

```lua
local id = websocket.Connect("wss://your-server/socket", {
    onOpen    = function()      websocket.Send(id, "hello") end,
    onMessage = function(msg)   print("got:", msg) end,
    onClose   = function()      print("closed") end,
    onError   = function(err)   print("error:", err) end,
})
```

---

## `Send`

```lua
websocket.Send(id: number, data: string)
```

Both arguments required. Returns `nil` regardless of whether the connection is open. A message sent before `onOpen` fires is queued by the OS but may be dropped — send in the `onOpen` callback for reliability.

```lua
websocket.Send(id, "ping")
websocket.Send(id, '{"type":"update","hp":' .. p.Health .. '}')
```

---

## `Close`

```lua
websocket.Close(id: number)
```

Closes the connection. Silent no-op for unknown ids.

```lua
cheat.register("shutdown", function()
    if ws_id then websocket.Close(ws_id) end
end)
```

---

## Patterns

### Reconnect with backoff

```lua
local ws_id, backoff = nil, 500

local function connect(url)
    ws_id = websocket.Connect(url, {
        onOpen    = function() backoff = 500 end,
        onMessage = function(msg) handle(msg) end,
        onClose   = function() end,
        onError   = function(err)
            local retry_at = utility.GetTickCount() + backoff
            backoff = math.min(backoff * 2, 30000)
            cheat.register("onUpdate", function()
                if utility.GetTickCount() >= retry_at then
                    connect(url)
                end
            end)
        end,
    })
end

connect("wss://your-server/socket")
```

### Heartbeat

```lua
local last_ping = 0
cheat.register("onUpdate", function()
    local now = utility.GetTickCount()
    if now - last_ping > 10000 then
        websocket.Send(ws_id, "ping")
        last_ping = now
    end
end)
```
