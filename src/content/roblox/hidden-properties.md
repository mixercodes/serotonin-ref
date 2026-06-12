# Hidden properties

Serotonin's sandbox hides a set of render-critical properties: they read as `nil`, `""`, or a placeholder no matter what the instance actually holds. Every one of them is recoverable with a typed [`memory.Read`](/docs/libraries/memory) at a fixed offset from the instance's engine pointer.

This page covers the **mechanism** — how to find the offsets at runtime, how to read them, and how to validate what comes back. What the recovered values *mean* lives on the semantic pages: [part shapes](/docs/roblox/part-shapes) (the Shape byte), [classic meshes](/docs/roblox/classic-meshes) (MeshType, Scale, Offset), and [surfaces & decals](/docs/roblox/surfaces-decals) (Face, decal compositing, SurfaceAppearance).

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

`instance.Address` is the real engine instance pointer — not a handle or a hash. Cross-check it against the [`Part`](/docs/userdata/Part) userdata for the same part: `inst.Address == entityPart:GetPartAddress()`, and the Primitive pointer read at the BasePart `Primitive` offset equals `entityPart:GetPartPrimitive()`. So `memory.Read(type, inst.Address + offset)` reads that instance's engine memory directly.

> [!NOTE]
> Material is the one property below that lives on the **Primitive struct**, not the instance. Read the Primitive pointer (BasePart `Primitive` offset) first, guard it with `memory.IsValid`, then read the `ushort` at the Primitive `Material` offset.

## Resolving the offsets

Offsets shift with every Roblox engine update — they are *offsets*, not constants — so a script must never hardcode them or read them from a dump file that can fall out of sync. **Derive them at runtime from live instances** and validate before use. The working pattern is two-tier: pin each class to an **anchor** found by a signature that cannot false-match, then place the class's remaining fields from their last-known **relative layout** (deltas from the anchor) — validating every one against the live samples and dropping any that fails. A whole-struct shift (the common case between builds) moves the anchor and keeps the deltas valid; an intra-class reorder fails validation and falls back to an anchored window scan.

Anchor signatures that hold up live:

- **Asset-string fields** (`Decal.ColorMapContent`, `SpecialMesh.MeshId`, `SurfaceAppearance.ColorMap`): the offset that holds a content-URL string (a run of 5+ digits) across most sampled instances. Distinctive enough that a handful of agreeing samples pin it.
- **Primitive + Material**: the unique `(pointer offset, ushort offset)` pair whose dereferenced value lands in the Enum.Material value set for *every* sampled part. Enum membership is selective, so exactly one pair survives.
- **Color3 → Shape**: `part.Color` is the one sandbox-exposed ground truth — match its byte triple in memory, then find Shape past it as the byte in `0..4` whose **modal value is Block (1)** across a spread sample. The mode test is load-bearing: a neighbouring surface byte also sits in `0..4` and *varies* (Studs-modal on classic maps), so a uniqueness-by-variance rule picks the wrong byte on all-Block maps. With the mode rule, an all-Block map leaves Shape unresolved — correctly, since there is nothing to detect.
- **DataModelMesh `Offset` + `Scale`**: two adjacent `vector3` fields — Offset first (modally `(0,0,0)`, its default), Scale 12 bytes later (modally nonzero). Score candidates by how many samples read all-zero in the first field; runs of zeros and ones overlap (`VertexColor` is another all-ones vec3 right after Scale), and only the true pair has Offset zero on most samples. This anchors the mesh family without any asset string, so geometric-mesh-only maps still resolve.

Fields with no usable signature of their own (`Decal.Face`, `Decal.Transparency`, `Texture.StudsPerTileU/V`, `SpecialMesh.MeshType`/`MeshId`/`TextureId`) ride the layout deltas, each validated by value-domain across the samples before acceptance. Searching a window for these instead is under-determined in practice: a 25-offset window gets 25 chances to false-match (an all-opaque map makes *every* zero float a plausible Transparency), where a single validated hypothesis gets one.

Four scan disciplines, all learned the hard way:

- **Align the scan to the field size.** A window stepping `lo, hi, 4` from a misaligned base never lands on a 4-aligned field — it silently finds nothing and looks like bad samples.
- **Accept by quorum, not all-must-pass.** One stale sample (instance streamed out, address reused) or one mid-animation value (games tween `Scale` through zero to hide meshes) must not veto the true offset. ~85% agreement works; for the vec3 pair, require nonzero Scale only on a majority.
- **Pool classes that share a struct, split where they diverge.** `Decal` and `Texture` share the layout for the anchor and Face/Transparency, but tiling floats exist only on `Texture` — validating them against a pooled sample can never pass.
- **Unit-range floats need a low-end witness.** "Every sample reads in `[0,1]`" is a weak signature — a junk field constant at exactly `1.0` passes it. For a transparency-like field, also demand at least one sample reading near zero (fully opaque instances exist on any real map) before accepting the offset. A false positive here is worse than no offset: downstream "skip invisible" logic then drops *every* instance as fully transparent.

Leave any field that can't be pinned unresolved and skip its read — **derive-or-disable**: a missing offset emits nothing, where a wrong one would emit garbage.

### Sample acquisition: don't starve

How the resolver *gets* its samples matters as much as the signatures. The obvious design — a dedicated budget-capped workspace walk, re-run a few times while the place streams in, then locked for the session — fails silently on big maps: the walk can exhaust its node budget on every attempt without ever visiting a single instance of a class, the attempt budget runs out, and that family streams nothing for the rest of the session even though the class is right there. Runtime-measured failure: a place with 11 live Decals where a 5,000-node walk reached only 2 of them *after* the map had fully loaded — and none during the join window, when the attempts actually ran.

Harvest samples from traversal work the script already does instead of relying only on a timed walk:

- **Any periodic full traversal** (a map scan, an ESP sweep) touches every instance anyway — while a family is unresolved, record the addresses of its class instances as they pass (dedup by address, cap each pool at ~12–14).
- **Per-avatar child iteration** reaches classes the map may not contain at all: characters carry SpecialMeshes (hats, R6 heads) and CharacterMeshes in every game.
- When a pool grows, re-run **just that family's derivation** against it — dirty-gated (only on new samples) and tries-capped (~6 per family), so a family that genuinely can't pin stops costing anything.
- On success, refresh whatever consumes the offsets immediately instead of waiting out the next periodic pass.

Pools and their dedup sets are address-keyed — clear them on place change like every other address-keyed cache. Steady-state cost once everything resolves: one table lookup per traversed node. The performance stakes are real in both directions — a resolver that keeps failing keeps paying for full walks and window scans (thousands of sandbox calls compressed into single frames, every attempt, every place), where one that resolves quickly goes permanently quiet.

```lua
local OFF = {}        -- filled by the resolver; nil = don't attempt that read
local GOT = {}        -- per-field gate: a feature reads memory only once its offset is confirmed

-- Example signature: the offset holding an asset-id string across a sample of instances.
local function asset_offset(addrs, lo, hi)
    local best, best_hits = nil, 0
    for off = lo, hi, 4 do
        local hits = 0
        for _, a in ipairs(addrs) do
            local s = memory.Read("string", a + off)
            -- type-check: an unmapped read returns a string sentinel, not nil (see warning below)
            if type(s) == "string" and s:match("%d%d%d%d%d") then hits = hits + 1 end
        end
        if hits > best_hits then best_hits, best = hits, off end
    end
    if best_hits >= math.ceil(#addrs * 0.6) then return best end
    return nil
end
```

> [!WARNING]
> **`memory.Read` returns a string sentinel, not `nil`, on an unmapped or out-of-bounds read.** A signature scan steps across offsets that aren't always valid, so the result is truthy garbage. Indexing it (`.X` on a presumed `vector3`) or comparing it (`>=` on a presumed number) raises `bad argument #1 to '__index' (__vector3_meta expected, got string)` or an arithmetic-on-string error. **Type-check every speculative read** — `type(v) == "number"` / `"userdata"` / `"string"` — before using the value. Reads at a known-good offset don't hit this; scanning does.

## The property catalog

| Class | Property | Read type | Notes |
|---|---|---|---|
| BasePart | Primitive | `pointer` | equals `GetPartPrimitive()`; guard with `memory.IsValid` |
| BasePart | Material | `ushort` | **Primitive-relative**; Enum.Material value — validate against the known-values set |
| BasePart | Shape | `byte` | Enum.PartType `0..4` — see [part shapes](/docs/roblox/part-shapes). Only meaningful when ClassName is `Part`; WedgePart/CornerWedgePart are separate classes and their Shape byte is meaningless |
| Decal | ColorMapContent | `string` | the texture content URL — same layout for `Texture` instances |
| Decal | Face | `int` | Enum.NormalId `0..5` — see [surfaces & decals](/docs/roblox/surfaces-decals) |
| Decal | Transparency | `float` | `0..1`, shared layout with `Texture` — accept only with a low-end witness (see scan disciplines) |
| Texture | StudsPerTileU/V | `float` ×2 | adjacent floats, `Texture`-only — validate on Texture samples, never a pooled Decal+Texture sample |
| SpecialMesh | Offset | `vector3` | DataModelMesh base — shared by SpecialMesh / CylinderMesh / BlockMesh; semantics on [classic meshes](/docs/roblox/classic-meshes) |
| SpecialMesh | Scale | `vector3` | same; negative components are legitimate (mirror trick) |
| SpecialMesh | MeshId | `string` | `""` when the mesh is not a FileMesh |
| SpecialMesh | TextureId | `string` | |
| SpecialMesh | MeshType | `byte` | Enum.MeshType `0..11` |
| SurfaceAppearance | ColorMap | `string` | overrides `MeshPart.TextureId` in-engine — see [surfaces & decals](/docs/roblox/surfaces-decals) |

Read types are the [`memory`](/docs/libraries/memory) type strings — `vector3` returns a `Vector3` userdata, `string` reads a NUL-terminated C string, `pointer` is an 8-byte address.

## Validation discipline

Memory reads can land on reparented or otherwise odd instances, and a signature scan can mis-pin a field — a read that *succeeds* is not a read that is *correct*. Validate everything:

- **Type-check every speculative read** (see the warning above) before any compare, arithmetic, or index.
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
    if not GOT.material then return nil end
    local mat
    pcall(function()
        local prim = memory.Read("pointer", inst.Address + OFF.primitive)
        if type(prim) == "number" and memory.IsValid(prim) then
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
    if not GOT.shape then return 1 end
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
    if type(url) ~= "string" or url == "" then return nil end
    if url:find("rbxasset://", 1, true) then return nil end   -- engine-local, skip
    return url:match("(%d+)%s*$")
end

local function read_decal_texture_id(decal)
    if not GOT.decal_tex then return nil end
    local ok, url = pcall(memory.Read, "string", decal.Address + OFF.decal_tex)
    if not ok then return nil end
    return asset_id(url)
end
```

### Scale with signs preserved

```lua
local function valid_scale(v)
    if type(v) ~= "userdata" then return false end   -- string sentinel on a bad read
    local cs = { v.X, v.Y, v.Z }
    for i = 1, 3 do
        local m = math.abs(cs[i])
        if m < 1e-4 or m > 1e4 then return false end
    end
    return true   -- magnitude check only — negative components stay negative
end

local function read_mesh_scale(mesh)
    if not GOT.dmm_scale then return nil end
    local ok, v = pcall(memory.Read, "vector3", mesh.Address + OFF.dmm_scale)
    if ok and valid_scale(v) then return v end
    return nil
end
```
