# Surfaces & decals

Per-face images on `BasePart`s: `Decal` and `Texture` instances parent to a part and paint one of its six faces. The sandbox hides their key properties — `Decal.Texture` reads `nil` — so reading them takes a memory read at a known offset. This page covers the face enum, the Decal/Texture data model, decal compositing semantics, and the `SurfaceAppearance` override that breaks naive `MeshPart.TextureId` readers.

## Enum.NormalId

A decal's `Face` property is an `Enum.NormalId` — one of the part's six faces, named in the part's **local** axes:

| Name | Value | Local axis |
|---|---|---|
| Right | 0 | +X |
| Top | 1 | +Y |
| Back | 2 | +Z |
| Left | 3 | −X |
| Bottom | 4 | −Y |
| Front | 5 | −Z |

> [!NOTE]
> Characters face their HumanoidRootPart's local **−Z** — `Front` in NormalId terms. The visible face of signs and goals is usually `Front` too.

Faces are part-local, so world placement needs the part's orientation — which the sandbox also hides (`part.CFrame` and `part.Orientation` are `nil` for all parts). Recover the local axes from [`draw.GetPartCorners`](/docs/libraries/draw#getpartcorners): `u = corners[2]-corners[1]` (local +X scaled by `Size.X`), `v = corners[3]-corners[1]` (+Y), `w = corners[5]-corners[1]` (+Z). The face center is `part.Position` plus or minus half the matching axis vector (sign from the table above); the face plane is spanned by the other two axes.

## Decal vs Texture

Both classes are face images, and both store their data in the same two underlying properties — ColorMapContent (the image URL) and Face (the NormalId). The difference:

- **Decal** — stretches the image once across the whole face.
- **Texture** — tiles the image across the face; `StudsPerTileU` / `StudsPerTileV` set the tile size in studs.

Classic `SpecialMesh` gear stores its texture on the mesh modifier (`SpecialMesh.TextureId`) instead — see [classic meshes](/docs/roblox/classic-meshes).

## Reading the data from the sandbox

`Decal.Texture` is `nil` in the sandbox, for `Texture` instances too. The data is readable via `memory.Read` at `instance.Address + offset`, using the Decal `ColorMapContent` (`string` — the texture content URL) and `Face` (`int` — NormalId 0–5) offsets, resolved at runtime ([hidden properties](/docs/roblox/hidden-properties)). The same layout applies to `Texture` instances.

> [!WARNING]
> **Offsets change across Roblox engine updates** — resolve them at runtime by signature; never hardcode. See [hidden properties](/docs/roblox/hidden-properties) for the resolver and the full validation discipline.

```lua
local OFF = { decal_content = ..., decal_face = ... }  -- resolved at runtime; see hidden properties

local function read_decal(decal)
    local url, face
    pcall(function()
        url  = memory.Read("string", decal.Address + OFF.decal_content)
        face = memory.Read("int",    decal.Address + OFF.decal_face)
    end)
    if not url or url == "" then return nil end
    if not face or face < 0 or face > 5 then return nil end  -- misread, discard
    local id = url:match("(%d+)%s*$")                        -- trailing digits = asset id
    return { url = url, id = id, face = face }
end
```

Validation, per the [hidden properties](/docs/roblox/hidden-properties) discipline: accept only `Face` values in 0–5, extract asset ids with `match("(%d+)%s*$")`, and skip `rbxasset://` URLs — those are engine-local files, not fetchable. Downloading the image uses the same asset-delivery endpoint and place-context rules as meshes — see [mesh formats](/docs/roblox/mesh-formats).

## Decal compositing

The engine draws the decal **over** the part's surface color:

- **Transparent texels** show the part color through.
- **Opaque texels** show the image as-is — **not** tinted by the part color.

> [!WARNING]
> **The black-RGB trap.** Decal images with transparent backgrounds typically carry **black RGB in their transparent texels**. A renderer that multiplies the texture with the part color — or samples RGB while ignoring alpha — shows those regions dark instead of showing the part color. External renderers must alpha-blend instead: `out = decal.rgb * decal.a + part.rgb * (1 - decal.a)`.

This only matters when recreating the visual outside the engine (world exporters, radar viewers). In-engine, Roblox composites correctly on its own.

## SurfaceAppearance overrides MeshPart.TextureId

A `MeshPart` with a `SurfaceAppearance` child renders the SurfaceAppearance's **ColorMap** — the legacy `TextureId` property on the part is ignored by the engine. Two failure modes for anything that reads only `TextureId`:

- **Stale `TextureId`** — retextured catalog gear commonly keeps an old, unrelated texture in `TextureId` while the real skin lives in the SurfaceAppearance. A `TextureId`-only reader shows the wrong skin.
- **Empty `TextureId`** — [character limbs](/docs/roblox/character-rigs) commonly have an empty `TextureId` plus a real SurfaceAppearance ColorMap. A `TextureId`-only reader shows no texture at all.

`SurfaceAppearance.ColorMap` is sandbox-invisible — read the `string` at the `SurfaceAppearance` `ColorMap` offset, resolved at runtime as in [hidden properties](/docs/roblox/hidden-properties) (same caveats as above):

```lua
local OFF_SA_COLORMAP = ...  -- resolved at runtime; see hidden properties

-- Resolution order: SurfaceAppearance ColorMap first, TextureId as legacy fallback.
local function mesh_texture(mesh_part)
    local sa = mesh_part:FindFirstChild("SurfaceAppearance")
    if sa then
        local ok, url = pcall(memory.Read, "string", sa.Address + OFF_SA_COLORMAP)
        if ok and url and url ~= "" then return url end
    end
    return mesh_part.TextureId  -- legacy path; may be stale or empty (see above)
end
```

## Official references

- [Enum.NormalId](https://create.roblox.com/docs/reference/engine/enums/NormalId) — the face enum
- [Decal](https://create.roblox.com/docs/reference/engine/classes/Decal) / [Texture](https://create.roblox.com/docs/reference/engine/classes/Texture) — class references (Texture adds `StudsPerTileU/V` tiling)
- [SurfaceAppearance](https://create.roblox.com/docs/reference/engine/classes/SurfaceAppearance) — the PBR override object
