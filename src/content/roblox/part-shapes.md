# Part shapes

What a `BasePart` renders as is determined by its class plus, for the `Part` class only, the `Shape` property (`Enum.PartType`). This page gives the exact enum values, the render semantics of each shape, and the exact local-space geometry of wedges — everything needed to reconstruct true part geometry from Serotonin's sandbox, where `Shape`, `CFrame`, and `Orientation` are all unreadable directly.

## Enum.PartType

| Name | Value | Renders as |
|---|---|---|
| `Ball` | 0 | sphere of diameter `min(Size.X, Size.Y, Size.Z)` |
| `Block` | 1 | box (the default) |
| `Cylinder` | 2 | cylinder along the part's local **X** axis — length `Size.X`, circular cross-section of diameter `min(Size.Y, Size.Z)` |
| `Wedge` | 3 | identical geometry to the `WedgePart` class |
| `CornerWedge` | 4 | identical geometry to the `CornerWedgePart` class |

`Wedge` and `CornerWedge` were added to `PartType` in 2023 (engine v575, browsable v580, announced June 2023 as "Improvements to Part Shape & Size"). Older scripts and tools that assume `Shape` is `0..2` silently miss them.

> [!WARNING]
> **The `Shape` property is only meaningful on the `Part` class.** `WedgePart` and `CornerWedgePart` are separate classes — match them by `ClassName`. Reading the Shape byte on those classes returns garbage; do not interpret it.

## Ball and Cylinder do not stretch

Non-uniform sizes on `Ball` and `Cylinder` parts have been allowed since the 2023 update, but the rendered shape stays round: per the official announcement, "the real diameter is the minimum of all three sides". Ellipsoids were explicitly described as a separate (unshipped) feature.

> [!WARNING]
> A stretched-looking sphere in a live game is **not** a `Ball` part — it is a `Part` with a `SpecialMesh` of MeshType `Sphere`, which scales with the part's proportions into an ellipsoid. Same for elliptical cylinders (`CylinderMesh` with unequal `Scale.X`/`Scale.Z`). See [classic meshes](/docs/roblox/classic-meshes).

Practical consequences for a renderer or exporter:

- `Ball`: sphere of diameter `min(Size)`, centred on `part.Position`. The rest of the part box is empty space.
- `Cylinder`: the round faces sit on the local **±X** faces of the part box. Note this differs from `CylinderMesh`, whose axis is local **Y** — see [classic meshes](/docs/roblox/classic-meshes).

## WedgePart geometry

In part-local coordinates (each axis spanning `±Size/2`), a wedge has exactly 6 vertices:

| Vertices | Local position |
|---|---|
| 4 bottom corners | `(±Size.X/2, −Size.Y/2, ±Size.Z/2)` |
| 2 top corners | `(±Size.X/2, +Size.Y/2, +Size.Z/2)` — at **+Z only** |

Faces: a flat bottom (−Y), a full-height vertical face at the **back** (+Z), two vertical triangular side faces (±X), and one sloped rectangular face rising from the front-bottom edge (−Z) to the top-back edge.

```
side view, looking down local +X (left = -Z front, right = +Z back)

                top-back edge (+Y, +Z)
                      *
                   .  |
       slope    .     |
             .        |  vertical back face (+Z),
          .           |  full height
       .              |
  *  .  .  .  .  .  . *
  front-bottom        back-bottom
  edge (-Y, -Z)       edge (-Y, +Z)
         flat bottom (-Y)
```

The downhill direction of the slope (the way a ball rolls off it) is the devforum-accepted formula:

```
downhill = LookVector * Size.Z - UpVector * Size.Y   -- then normalize
```

where `LookVector` is the part's local **−Z** and `UpVector` its local **+Y**. In the sandbox neither is readable from `CFrame` (always `nil`) — recover them from `draw.GetPartCorners` instead:

```lua
local c = draw.GetPartCorners(wedge)
-- c[3]-c[1] = local +Y axis * Size.Y;  c[5]-c[1] = local +Z axis * Size.Z
local downhill = ((c[1] - c[5]) + (c[1] - c[3])).Unit
```

## CornerWedgePart geometry

5 vertices: the 4 bottom corners plus a single apex at **(+X, +Y, −Z)** — directly above the front-right bottom corner.

| Vertices | Local position |
|---|---|
| 4 bottom corners | `(±Size.X/2, −Size.Y/2, ±Size.Z/2)` |
| 1 apex | `(+Size.X/2, +Size.Y/2, −Size.Z/2)` |

Faces: a rectangular flat bottom (−Y), two full-height vertical triangular faces on the **+X** and **−Z** sides (the two sides that share the apex's corner), and two sloped triangular faces falling away toward −X and +Z.

```
top view (apex marked A, at the +X / -Z corner)

        -Z (front)
   +----------A      A = apex (+X, +Y, -Z)
   |          |
   |  bottom  |      vertical faces: +X (right), -Z (top edge)
   |          |      sloped faces: toward -X and +Z
   +----------+
        +Z (back)
```

## Reading Part.Shape in Serotonin

`part.Shape` is `nil` in the sandbox. The shape is readable as a byte at a fixed offset from `part.Address` — see [hidden properties](/docs/roblox/hidden-properties) for the technique and how to resolve offsets from the `version-*.json` instead of hardcoding.

```lua
-- Build-dependent: resolve from the version-*.json (BasePart -> "Shape") at load.
local SHAPE_OFFSET = ...   -- see hidden properties for the parsing pattern

local PART_TYPE = { [0] = "Ball", "Block", "Cylinder", "Wedge", "CornerWedge" }

local function read_shape(part)
    if part.ClassName ~= "Part" then return nil end   -- byte meaningless elsewhere
    local ok, b = pcall(memory.Read, "byte", part.Address + SHAPE_OFFSET)
    if ok and b and b >= 0 and b <= 4 then return b end
    return nil   -- out-of-range byte = misread; fall back to Block
end
```

> [!NOTE]
> **Validate the byte.** Memory reads can land on reparented or odd instances — accept only `0..4` and treat anything else as a misread (render as a Block). Wrap every read in `pcall`.

## Recovering orientation

Knowing the shape gives you geometry in part-local space; placing it in the world needs the part's orientation, and `part.CFrame` / `part.Orientation` are `nil` for every part in the sandbox. Use [`draw.GetPartCorners`](/docs/libraries/draw#getpartcorners): `corners[2]-corners[1]`, `corners[3]-corners[1]`, `corners[5]-corners[1]` are the local +X/+Y/+Z axes scaled by `Size`, with exact signs and a right-handed basis.

> [!NOTE]
> `GetPartCorners` always returns the 8 corners of the **bounding box**, even for wedges — it never returns the wedge's 6 (or 5) vertices. Build true wedge geometry by combining the box basis with the local vertex tables above: each vertex is `center + a*u + b*v + c*w` with `(a, b, c)` the local coordinates in `[-0.5, 0.5]` and `u`, `v`, `w` the three edge vectors leaving `corners[1]`.

## TrussPart and CSG unions

- **TrussPart** renders as a lattice beam built from 2×2-stud segments; the `Style` property changes the strut pattern. For bounding/ESP purposes treat it as its box.
- **UnionOperation / NegateOperation** (CSG) render meshes are embedded in the place file and are **not** fetchable from public asset endpoints (see [mesh formats](/docs/roblox/mesh-formats)). Treat unions as their bounding box.

## Provenance

- Enum values and the Ball/Cylinder min-diameter rule: official creator docs (API dump + YAML) and the June 2023 devforum announcement "Improvements to Part Shape & Size".
- Wedge and CornerWedge vertex sets: EgoMoose's GJK collision vertex tables, the de facto community reference for exact part geometry.
- The `GetPartCorners` basis (axis identity, signs, right-handedness) and the wedge bounding behaviour: runtime-verified through the Serotonin agent against a live map — 777 parts including 121 wedges at arbitrary roll/pitch/yaw, edge lengths matching `Size` per axis with zero sign flips while tracking rotating parts.
- The Shape byte route: runtime-verified; offsets shift across Roblox updates — always resolve them from the [version json](/docs/roblox/hidden-properties).

## Official references

- [Enum.PartType](https://create.roblox.com/docs/reference/engine/enums/PartType) — the enum, with values
- [WedgePart](https://create.roblox.com/docs/reference/engine/classes/WedgePart) / [CornerWedgePart](https://create.roblox.com/docs/reference/engine/classes/CornerWedgePart) / [TrussPart](https://create.roblox.com/docs/reference/engine/classes/TrussPart) — class references
- [Improvements to Part Shape & Size](https://devforum.roblox.com/t/improvements-to-part-shape-size/2443389) — the June 2023 announcement adding Wedge/CornerWedge to `Part.Shape` and confirming the Ball min-diameter rule
