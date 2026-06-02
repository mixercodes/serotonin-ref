# `Instance`

Roblox Instance userdata returned by `game.Workspace`, `:FindFirstChild`, and the rest of the tree-walk API. Every property read and method call goes through the cheat's safe-accessor layer.

**Property names are case-sensitive.** `instance.position` returns `nil`; `instance.Position` returns the value. Different Roblox classes expose different properties — reading a property that doesn't exist on the underlying class returns `nil` without error.

**`IsA` compares ClassName, not inheritance.** `part:IsA("Instance")` returns `false`. Check `ClassName` directly against concrete class names.

## Tree walk

| Method | Returns |
|---|---|
| `:GetChildren()` | table of direct children |
| `:GetDescendants()` | table of all descendants (expensive on large trees) |
| `:FindFirstChild(name)` | first child with matching Name, or `nil` |
| `:FindFirstChildOfClass(className)` | first child with matching ClassName, or `nil` |
| `:FindFirstAncestor(name)` | first ancestor with matching Name |
| `:FindFirstAncestorOfClass(className)` | first ancestor with matching ClassName |
| `:FindFirstDescendant(name)` | first descendant with matching Name |
| `:FindFirstDescendantOfClass(className)` | first descendant with matching ClassName |

```lua
local char = game.Workspace:FindFirstChild("PlayerName")
local hrp  = char and char:FindFirstChild("HumanoidRootPart")
local hum  = char and char:FindFirstChildOfClass("Humanoid")
```

## Type and hierarchy

```lua
instance:IsA(className)             → bool   -- ClassName equality, NOT inheritance
instance:IsDescendantOf(ancestor)   → bool
instance:IsAncestorOf(descendant)   → bool
```

## Attributes

Attributes are invisible to workspace dumps — `grep_dump` cannot find them. Use these methods to read per-instance state flags.

```lua
instance:GetAttributes()               → array of {Name, Value, TypeName}
instance:GetAttribute(name)            → any | nil
instance:GetFirstAttributeOfType(type) → any
instance:SetAttribute(name, value)
```

`GetAttributes()` returns an **array** — iterate with `pairs` or `ipairs`:

```lua
for _, attr in ipairs(char:GetAttributes()) do
    print(attr.Name, attr.TypeName, attr.Value)
end
```

Note: `Value` for a boolean attribute may be exposed as a number in the sandbox. Check `type(attr.Value)` before comparing.

## Visual / lifecycle

```lua
instance:SetHighlightOnTop()
instance:SetHighlightTransparency(value)
instance:Destroy()
```

## Patterns

### Find all players' characters

```lua
local ws = game.Workspace
for _, p in ipairs(game.GetService("Players"):GetChildren()) do
    local char = ws:FindFirstChild(p.Name)
    if char then
        local hrp = char:FindFirstChild("HumanoidRootPart")
        if hrp then
            print(p.Name, hrp.Position)
        end
    end
end
```

### Read a per-player state flag

```lua
local char = game.Workspace:FindFirstChild(p.Name)
if char then
    local flag = char:GetAttribute("IsBlocking")
    -- flag may be bool or number — check type
    if flag ~= nil and flag ~= false and flag ~= 0 then
        -- player is blocking
    end
end
```
