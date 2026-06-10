# Hidden properties

Serotonin's sandbox hides a set of render-critical properties: they read as `nil`, `""`, or a placeholder no matter what the instance actually holds. Every one of them is recoverable with a typed [`memory.Read`](/docs/libraries/memory) at a fixed offset from the instance's engine pointer.

This page covers the **mechanism** — where the offsets come from, how to read them, and how to validate what comes back. What the recovered values *mean* lives on the semantic pages: [part shapes](/docs/roblox/part-shapes) (the Shape byte), [classic meshes](/docs/roblox/classic-meshes) (MeshType, Scale, Offset), and [surfaces & decals](/docs/roblox/surfaces-decals) (Face, decal compositing, SurfaceAppearance).

## What the sandbox hides

| Property | Sandbox read | Actual storage |
|---|---|---|
| `Part.Material` | `"Unknown"` | `ushort` on the Primitive struct |
| `Part.Shape` | `nil` | `byte` on the instance (Enum.PartType) |
| `Decal.Texture` / `Texture.Texture` | `nil` | content-URL `string` on the instance |
| `SpecialMesh.MeshId` | `""` | content-URL `string` on the instance |
| `SurfaceAppearance.ColorMap` | invisible — no property at all | content-URL `string` on the instance |

> [!WARNING]
> These are silent failures. `Decal.Texture` returning `nil` and `SpecialMesh.MeshId` returning `""` look exactly like an empty decal or an unset mesh — there is no error to catch. If a script "can't see" a texture or shape the game clearly renders, this is why.

## The instance pointer is real

`instance.Address` is the real engine instance pointer — not a handle or a hash. Verified two independent ways against the [`Part`](/docs/userdata/Part) userdata for the same part:

- `inst.Address == entityPart:GetPartAddress()`
- the Primitive pointer read at the BasePart `Primitive` offset equals `entityPart:GetPartPrimitive()`

So `memory.Read(type, inst.Address + offset)` reads that instance's engine memory directly.

> [!NOTE]
> Material is the one property in the table below that lives on the **Primitive struct**, not the instance. Read the Primitive pointer (BasePart `Primitive` offset) first, guard it with `memory.IsValid`, then read the `ushort` at the Primitive `Material` offset.

## The offsets file: `version-*.json`

Offsets shift with every Roblox engine update, so this page deliberately lists **no numbers** — the saveinstance `version-<hash>.json` that lives in the Serotonin `files/` directory (the [`file`](/docs/libraries/file) sandbox root) documents per-class property offsets and is updated per engine release. Each property maps to an array whose first element is the offset, which is what the parse pattern below extracts.

Parse it at script load and skip any read whose offset didn't resolve:

```lua
local OFF = {}   -- filled from the version json; nil = don't attempt that read

local function load_offsets()
    pcall(function()
        local name
        for _, e in ipairs(file.listdir("") or {}) do
            if e.isFile and e.name:match("^version%-%x+%.json$") then name = e.name end
        end
        local raw = name and file.read(name)
        if not raw then return end
        local function sect(cls) return raw:match('"' .. cls .. '"%s*:%s*(%b{})') end
        local function num(s, prop)
            return s and tonumber(s:match('"' .. prop .. '"%s*:%s*%[%s*(%d+)')) or nil
        end
        local bp, dc, sm, sa = sect("BasePart"), sect("Decal"), sect("SpecialMesh"), sect("SurfaceAppearance")
        OFF.primitive   = num(bp, "Primitive")
        OFF.material    = num(bp, "Material")          -- Primitive-relative
        OFF.shape       = num(bp, "Shape")
        OFF.decal_tex   = num(dc, "ColorMapContent")
        OFF.decal_face  = num(dc, "Face")
        OFF.dmm_offset  = num(sm, "Offset")            -- DataModelMesh base: also CylinderMesh/BlockMesh
        OFF.dmm_scale   = num(sm, "Scale")
        OFF.mesh_id     = num(sm, "MeshId")
        OFF.mesh_tex    = num(sm, "TextureId")
        OFF.sa_colormap = num(sa, "ColorMap")
    end)
end

load_offsets()
```

## The property catalog

Every entry below is runtime-verified (read live instances, checked the results against rendered geometry). Look the offset up in the json under the listed class/key.

| Class (json section) | Property (json key) | Read type | Notes |
|---|---|---|---|
| BasePart | Primitive | `pointer` | equals `GetPartPrimitive()`; guard with `memory.IsValid` |
| BasePart | Material | `ushort` | **Primitive-relative**; Enum.Material value — validate against the known-values set |
| BasePart | Shape | `byte` | Enum.PartType `0..4` — see [part shapes](/docs/roblox/part-shapes). Only meaningful when ClassName is `Part`; WedgePart/CornerWedgePart are separate classes and their Shape byte is meaningless |
| Decal | ColorMapContent | `string` | the texture content URL — same layout for `Texture` instances |
| Decal | Face | `int` | Enum.NormalId `0..5` — see [surfaces & decals](/docs/roblox/surfaces-decals) |
| SpecialMesh | Offset | `vector3` | DataModelMesh base — shared by SpecialMesh / CylinderMesh / BlockMesh; semantics on [classic meshes](/docs/roblox/classic-meshes) |
| SpecialMesh | Scale | `vector3` | same; negative components are legitimate (mirror trick) |
| SpecialMesh | MeshId | `string` | `""` when the mesh is not a FileMesh |
| SpecialMesh | TextureId | `string` | |
| SpecialMesh | MeshType | `byte` | **not in the json** — empirical, see below |
| SurfaceAppearance | ColorMap | `string` | overrides `MeshPart.TextureId` in-engine — see [surfaces & decals](/docs/roblox/surfaces-decals) |

Read types are the [`memory`](/docs/libraries/memory) type strings — `vector3` returns a `Vector3` userdata, `string` reads a NUL-terminated C string, `pointer` is an 8-byte address.

## MeshType: the empirical exception

The SpecialMesh `MeshType` byte is **not documented in the `version-*.json`**, so it has to be re-derived per build. The discovery check is mechanical:

1. Collect SpecialMesh instances whose `MeshId` (memory read) contains a numeric asset id — those are FileMesh (`5`) by definition.
2. Scan small instance-relative offsets (the low hundreds) for the one where **every** such instance reads `5`.
3. Sanity-check a known typeless instance — a classic sphere skydome should read `3` (Sphere) at the same offset.

In practice exactly one offset survives step 2.

> [!WARNING]
> Because it cannot be refreshed from the json, this offset has no automatic update path — re-run the discovery check after engine updates. Reads outside `0..11` are misreads — the value table and fallback semantics are on [classic meshes](/docs/roblox/classic-meshes).

## Validation discipline

Memory reads can land on reparented or otherwise odd instances — a read that *succeeds* is not a read that is *correct*. Validate everything:

- **Wrap every read in `pcall`.** A bad address raises; never let one instance kill the scan.
- **`memory.IsValid` before dereferencing any pointer.** The Primitive pointer especially — only follow it when `memory.IsValid(prim)` is true.
- **Material: enum-set only.** Accept only values in the official Enum.Material value set. Anything outside the set is a misread, not a new material.
- **Shape: range `0..4`.** Enum.PartType has exactly five values ([part shapes](/docs/roblox/part-shapes)). Anything else is a misread — fall back to Block.
- **Scale / Offset: clamp magnitude, never sign.** Require each component's absolute value in `(1e-4, 1e4)`. Negative components are legitimate — the [mirror trick](/docs/roblox/classic-meshes) flips meshes with `Scale = (-1, 1, 1)` and skydomes use `Scale ≈ (-600, -600, -600)`. Dropping the sign breaks both.
- **Asset ids: `match("(%d+)%s*$")`.** Content URLs come in several schemes; the trailing digit run is the id.
- **Skip `rbxasset://`.** Engine-local content — not fetchable from asset delivery, no numeric id to extract.

## Attributes: hidden from dumps, not from the API

Attributes are a different kind of hidden. They are invisible to instance-tree dumps (there is no child instance to list), but no memory read is needed — `GetAttributes()` works. The sandbox quirk is the return shape: an **array** of `{Name = ..., TypeName = ..., Value = ...}` tables, not the flat `{name = value}` dictionary standard Roblox returns. Iterate and match on `attr.Name`:

```lua
for _, attr in ipairs(inst:GetAttributes()) do
    if attr.Name == "TeamColor" then
        -- attr.TypeName, attr.Value
    end
end
```

See [Instance](/docs/userdata/Instance) for the full attribute API.

## Patterns

### Material through the Primitive

```lua
local VALID_MATERIAL = {}   -- keys: the official Enum.Material values, built once

local function read_material(inst)
    local mat
    pcall(function()
        local prim = memory.Read("pointer", inst.Address + OFF.primitive)
        if memory.IsValid(prim) then
            mat = memory.Read("ushort", prim + OFF.material)
        end
    end)
    if mat and VALID_MATERIAL[mat] then return mat end
    return nil   -- misread or unknown: treat as no data
end
```

### Shape with range check

```lua
local function read_shape(part)   -- ClassName must be "Part"
    local ok, b = pcall(memory.Read, "byte", part.Address + OFF.shape)
    if ok and type(b) == "number" and b >= 0 and b <= 4 then
        return b   -- Enum.PartType: 0 Ball, 1 Block, 2 Cylinder, 3 Wedge, 4 CornerWedge
    end
    return 1       -- misread: assume Block
end
```

### Asset id extraction

```lua
local function asset_id(url)
    if not url or url == "" then return nil end
    if url:find("rbxasset://", 1, true) then return nil end   -- engine-local, skip
    return url:match("(%d+)%s*$")
end

local function read_decal_texture_id(decal)
    local ok, url = pcall(memory.Read, "string", decal.Address + OFF.decal_tex)
    if not ok then return nil end
    return asset_id(url)
end
```

### Scale with signs preserved

```lua
local function valid_scale(v)
    if not v then return false end
    local cs = { v.X, v.Y, v.Z }
    for i = 1, 3 do
        local m = math.abs(cs[i])
        if m < 1e-4 or m > 1e4 then return false end
    end
    return true   -- magnitude check only — negative components stay negative
end

local function read_mesh_scale(mesh)
    local ok, v = pcall(memory.Read, "vector3", mesh.Address + OFF.dmm_scale)
    if ok and valid_scale(v) then return v end
    return nil
end
```
