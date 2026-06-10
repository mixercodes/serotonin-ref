# Classic meshes

`SpecialMesh`, `CylinderMesh`, and `BlockMesh` are mesh *modifier* instances — children of a `Part` that replace its rendered geometry. They predate `MeshPart` and are still everywhere: catalog gear, classic accessory handles (see [character rigs](/docs/roblox/character-rigs)), skydomes, and most pre-2015 maps. The part itself keeps its `Size` and `Position`; the child changes only what is drawn.

This matters for anything that derives visuals from part boxes: a classic mesh can render far larger than its part (skydomes), displaced from it (`Offset`), or as a completely different shape. Part-box ESP and geometry exporters that ignore these children draw the wrong thing.

> [!WARNING]
> The sandbox hides every interesting property on these instances: `SpecialMesh.MeshId` reads `""`, and `Scale`, `Offset`, and `MeshType` are not exposed at all. Everything below must be read via `memory.Read` at `instance.Address + offset` — see [hidden properties](/docs/roblox/hidden-properties) for the offset table and the `version-*.json` loader. This page covers the *semantics* of what you read back.

## The DataModelMesh family

All three classes share the `DataModelMesh` base, which carries the two properties common to every classic mesh:

| Property | Type | Meaning |
|---|---|---|
| `Scale` | Vector3 | size multiplier — semantics depend on mesh type (see below) |
| `Offset` | Vector3 | displaces the rendered mesh from the part centre, in part-**local** studs |

| Class | Renders |
|---|---|
| `SpecialMesh` | any `Enum.MeshType` shape; the `FileMesh` type additionally uses `MeshId` / `TextureId` |
| `CylinderMesh` | a cylinder along the part's local **Y** axis; can be elliptical |
| `BlockMesh` | a box at `part.Size × Scale` |

> [!WARNING]
> Never detect these with `:IsA("DataModelMesh")` — superclass checks are broken in the sandbox (exact `ClassName` only, and `IsA` can raise in some games). Match `ClassName` against the explicit set:

```lua
local CLASSIC_MESH = { SpecialMesh = true, CylinderMesh = true, BlockMesh = true }

local function find_classic_mesh(part)
    for _, child in ipairs(part:GetChildren()) do
        if CLASSIC_MESH[child.ClassName] then return child end
    end
    return nil
end
```

## Enum.MeshType

The `MeshType` byte on a `SpecialMesh` selects the shape:

| Name | Value | Scale multiplies |
|---|---|---|
| Head | 0 | part size |
| Torso | 1 | part size |
| Wedge | 2 | part size |
| Sphere | 3 | part size |
| Cylinder | 4 | part size |
| **FileMesh** | **5** | **native mesh size** |
| Brick | 6 | part size |
| Prism | 7 | part size |
| Pyramid | 8 | part size |
| ParallelRamp | 9 | part size |
| RightAngleRamp | 10 | part size |
| CornerWedge | 11 | part size |

A `MeshType` byte outside `0..11` is a memory misread — treat the part as its plain box.

## Scale semantics — the core distinction

Scale means two different things depending on the type, and confusing them renders geometry at wildly wrong sizes:

- **Geometric types (everything except FileMesh): `Scale` multiplies the PART size.** Rendered extents = `part.Size × Scale`, component-wise. An 11-stud part with a Sphere `SpecialMesh` at Scale 600 renders a ~6600-stud sphere — the classic skydome.
- **FileMesh (5): renders at native mesh size × `Scale`.** *Not* fitted to the part. The part box is only a placement anchor; native size is the extents of the mesh's authored vertices. A tiny part can carry a huge mesh and vice versa.

> [!NOTE]
> A `SpecialMesh` Sphere stretches into an ellipsoid with the part's proportions — unlike a Ball *part*, which clamps to a sphere of diameter `min(Size.X, Size.Y, Size.Z)` (see [part shapes](/docs/roblox/part-shapes)). A stretched-looking sphere in a game is a SpecialMesh, not a Ball part.

### FileMesh anchors by authored origin, not bounding box

Roblox places the file mesh's **authored local origin** at the part centre (plus `Offset`) and scales about it. A mesh whose authored origin is not its bounding-box centre renders off-centre relative to the part — common on classic gear.

`MeshPart` is the opposite: the engine fits the mesh's bounding box to the part box exactly, so bbox-normalised geometry plus the part box transform is exact for MeshParts.

> [!WARNING]
> Exporters that re-centre fetched geometry on its bounding box must add back `bboxCentre × Scale` when placing a FileMesh, or classic gear renders displaced. Do not apply MeshPart-style bbox fitting to SpecialMesh FileMeshes — they are anchored, not fitted.

## Offset

`DataModelMesh.Offset` displaces the rendered mesh from the part centre in part-**local** studs — it rides the part's rotation. Ignoring it renders the visual at the wrong spot.

`part.CFrame` is `nil` in the sandbox, so recover the local axes from [draw.GetPartCorners](/docs/libraries/draw):

```lua
-- world position of the rendered mesh centre
local corners = draw.GetPartCorners(part)
local size    = part.Size
local x_axis  = (corners[2] - corners[1]) / size.X   -- local +X
local y_axis  = (corners[3] - corners[1]) / size.Y   -- local +Y
local z_axis  = (corners[5] - corners[1]) / size.Z   -- local +Z
local centre  = part.Position
    + x_axis * off.X + y_axis * off.Y + z_axis * off.Z
```

## Negative Scale — the mirror trick

Negative `Scale` components are legitimate and common:

- Builders flip wedge file meshes with `Scale = (-1, 1, 1)` instead of authoring a mirrored asset.
- Skydomes use `Scale ≈ (-600, -600, -600)`: the negative scale inverts the face normals so the sphere is visible from the inside.

The engine accepts negative scale natively. External renderers must mirror via the transform — preserve the sign.

> [!WARNING]
> When validating Scale reads, clamp the **magnitude** only — never `abs()` the components or drop the sign. A skydome with its sign stripped becomes an opaque 6600-stud ball over the map.

## CylinderMesh and BlockMesh

- **CylinderMesh** renders a cylinder along the part's local **Y** axis — height `Size.Y × Scale.Y`, cross-section spanning `Size.X × Scale.X` by `Size.Z × Scale.Z`. The cross-section can be elliptical (`Scale.X ≠ Scale.Z`). Note the axis: a Cylinder *part* lies along local **X** (see [part shapes](/docs/roblox/part-shapes)); a CylinderMesh stands along Y.
- **BlockMesh** renders a box at `part.Size × Scale` — used to visually resize a part without changing the part itself.

Both share `Scale` and `Offset` from `DataModelMesh` at the same memory offsets; neither has a `MeshType` or `MeshId`.

## Reading classic meshes in Serotonin

All reads go through `memory.Read` at `mesh.Address + offset`. The offsets for `DataModelMesh.Offset`/`Scale` and `SpecialMesh.MeshId`/`TextureId` come from the saveinstance `version-*.json`; load them at script start as described in [hidden properties](/docs/roblox/hidden-properties).

> [!NOTE]
> The `MeshType` offset is **not** in the version json — it was found empirically (every FileMesh instance reads 5 there; a sphere skydome read 3). It is build-dependent like the rest; re-verify after Roblox updates using known FileMesh instances.

```lua
-- OFF.* loaded from the version-*.json — see /docs/roblox/hidden-properties
local FILE_MESH = 5

local function read_classic_mesh(mesh)
    local out = { class = mesh.ClassName }
    local ok = pcall(function()
        local addr = mesh.Address
        out.offset = memory.Read("vector3", addr + OFF.mesh_offset)  -- DataModelMesh.Offset
        out.scale  = memory.Read("vector3", addr + OFF.mesh_scale)   -- DataModelMesh.Scale
        if mesh.ClassName == "SpecialMesh" then
            out.mesh_type = memory.Read("byte", addr + OFF.mesh_type)
            if out.mesh_type == FILE_MESH then
                out.mesh_id    = memory.Read("string", addr + OFF.mesh_id)
                out.texture_id = memory.Read("string", addr + OFF.texture_id)
            end
        end
    end)
    if not ok then return nil end
    return out
end
```

The `MeshId` memory read returns `""` on a `SpecialMesh` whose type is not FileMesh — geometric types have no asset. Fetching and parsing the asset behind a `MeshId` is covered in [mesh formats](/docs/roblox/mesh-formats).

## Detection and sane-value guards

Memory reads can land on reparented or odd instances — validate everything before trusting it:

| Read | Treat as |
|---|---|
| `CylinderMesh` | cylinder along local +Y at `part.Size × Scale`, elliptical allowed |
| `BlockMesh` | box at `part.Size × Scale` |
| `SpecialMesh`, type in 0..11 except 5 | the geometric shape at `part.Size × Scale` |
| `SpecialMesh`, type 5, MeshId parses to an asset id | file mesh at native size × `Scale`, anchored by authored origin |
| `SpecialMesh`, type 5, MeshId empty or unparseable | fall back to the part box |
| type byte outside 0..11 | misread — fall back to the part box |

Guard rules:

- **Scale**: require each component's magnitude in roughly `(1e-4, 1e4)` — outside that is a misread. Negative components are legitimate (mirror trick); clamp magnitude only, never the sign.
- **Offset**: `(0, 0, 0)` is the normal default; components beyond ~`1e4` studs indicate a misread.
- **MeshId / TextureId**: extract the trailing digits with `s:match("(%d+)%s*$")`; skip `rbxasset://` URLs (engine-local, not fetchable from asset delivery).
- Wrap every read in `pcall`; on any failed guard, render the part box instead of garbage.

```lua
local function sane_vec(v)
    if not v then return false end
    return math.abs(v.X) < 1e4 and math.abs(v.Y) < 1e4 and math.abs(v.Z) < 1e4
end

local function asset_id(s)
    if not s or s == "" then return nil end
    if s:match("^rbxasset://") then return nil end
    return s:match("(%d+)%s*$")
end
```

## Official references

- [SpecialMesh](https://create.roblox.com/docs/reference/engine/classes/SpecialMesh) / [CylinderMesh](https://create.roblox.com/docs/reference/engine/classes/CylinderMesh) / [BlockMesh](https://create.roblox.com/docs/reference/engine/classes/BlockMesh) / [DataModelMesh](https://create.roblox.com/docs/reference/engine/classes/DataModelMesh) — class references (Scale/Offset property docs)
- [Enum.MeshType](https://create.roblox.com/docs/reference/engine/enums/MeshType) — the full value table
