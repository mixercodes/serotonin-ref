# Mesh file formats

The `.mesh` container Roblox serves from its asset CDN. This page is for consuming meshes **outside the game** — radars, exporters, inspectors. In-game, `draw.GetMesh` covers MeshParts (see [draw](/docs/libraries/draw)); everything here is about fetching the raw asset and parsing it yourself.

Where the ids come from: `MeshPart.MeshId`, `SpecialMesh.MeshId` / `TextureId`, Decal/Texture `ColorMapContent`, and `SurfaceAppearance.ColorMap` are all sandbox-hidden — read them via memory offsets ([hidden properties](/docs/roblox/hidden-properties)). How the mesh is *placed and scaled* once parsed is covered in [classic meshes](/docs/roblox/classic-meshes); which texture actually wins on a MeshPart is covered in [surfaces and decals](/docs/roblox/surfaces-decals).

All layouts below were verified by parsing live assets. Binary fields are little-endian.

## Detecting the version

Every `.mesh` file starts with an ASCII version line. Read the first 12 bytes and branch:

| Version | Encoding | Quirks |
|---|---|---|
| `1.00` | ASCII text | vertices stored **doubled** — scale by 0.5; V flipped |
| `1.01` | ASCII text | V flipped |
| `2.00` | binary | — |
| `3.xx` | binary | adds LOD bands |
| `4.xx` / `5.00` | binary | LODs + skinning envelopes |
| `6.00` | binary, `COREMESH` | uncompressed 40-byte records |
| `7.00` | binary, `COREMESH` | single Draco blob |

For the binary versions the version line is exactly 13 bytes including the trailing newline (`version 4.00\n`) — every offset below counts from there.

## v1.00 / v1.01 — text

Three lines: the version, the face count, then all faces on one line.

```text
version 1.00
n
[px,py,pz][nx,ny,nz][u,v,w][px,py,pz]...
```

Each face is 3 vertices; each vertex is three bracketed triples — position, normal, texture — 9 numbers per vertex, no index buffer. The third value of the texture triple carries no useful data; ignore it.

> [!WARNING]
> **v1.00 positions are stored doubled.** Scale every position by `0.5` or all v1.00 meshes come out twice their real size. The official FileMesh spec confirms this and notes it was "corrected in version 1.01" — only the positions changed; the UV quirk below applies to both.

> [!WARNING]
> **The V texture coordinate is upside down in v1.00 AND v1.01.** Per the official spec wording, the file stores `tex_U, 1.0 - tex_V` — so recover the real coordinate with `v = 1.0 - stored_v`. Using the stored value raw maps texture-atlas regions onto the wrong parts of the mesh (classic gear symptom: a hammer head wearing its handle's stripes). v2+ does not have this quirk.

## v2–v5 — binary

After the 13-byte version line comes a header block. Offsets are relative to the start of that block; the `u16` at `+0` is the header's own size, and vertex data begins at file offset `13 + headerSize`.

| Field | v2 | v3 | v4/v5 | Type |
|---|---|---|---|---|
| headerSize | +0 | +0 | +0 | u16 |
| vertSize | +2 | — | — | u8 |
| numVerts | +4 | +8 | +4 | u32 |
| numFaces | +8 | +12 | +8 | u32 |
| numLODs | — | +6 | +12 | u16 |
| numBones | — | — | +14 | u16 |

Honor the `headerSize` field rather than hardcoding per-version sizes — it is what actually positions the data section.

### Vertex records

Records are 36 or 40 bytes. The two verified fields:

| Offset in record | Field | Type |
|---|---|---|
| +0 | position | f32 × 3 |
| +24 | UV | f32 × 2 |

The bytes between (+12) hold the normal per the public FileMesh spec — same ordering as the v1 text format — but only the position and UV offsets were independently re-verified here. v2 declares its record size in the `vertSize` byte; for later versions, every asset checked used 40-byte records. Sanity-check the stride: `13 + headerSize + numVerts * stride` must land at the start of a plausible face (or skinning) section.

### Skinning envelopes

> [!WARNING]
> **When `numBones > 0`, skip `numVerts × 8` bytes between the vertex array and the face array.** These are per-vertex skinning envelopes. Forgetting the skip makes the face parser read envelope bytes as indices — garbage triangles, usually out-of-range indices. Always check `numBones` even if you don't care about skinning.

### Faces and LODs

Faces are triangles: 3 × u32 zero-based vertex indices each, `numFaces` of them.

> [!WARNING]
> **With LODs, the face array contains every detail band concatenated.** The LOD table (numLODs entries after the faces, per the public spec) partitions the face array by face index; `faces[lod0start..lod0end]` is the highest-detail band. Consume only that band — exporting the whole array gives you the mesh plus its decimated copies overlapping in the same space.

## v6 — COREMESH, uncompressed

Bytes 13..21 spell `COREMESH` — use that magic to confirm. Layout (file offsets):

| Offset | Field |
|---|---|
| +29 | numVerts (u32) |
| +33 | numVerts × 40-byte records — position f32×3 at +0, UV f32×2 at +24 |
| after vertices | numFaces (u32), then faces as u32 index triples |

The record layout matches v4/v5's 40-byte records, so a v4 vertex reader can be reused directly.

## v7 — COREMESH, Draco

Same `COREMESH` magic at bytes 13..21. The payload is a single raw Draco bitstream:

| Offset | Field |
|---|---|
| +29 | blobLen (u32) |
| +33 | the blob — starts with the ASCII bytes `DRACO` |

Hand the blob to any standard Draco decoder (Google's `draco` / the `draco3d` npm package). There is no Roblox-specific framing inside the blob.

## UV origin is top-left

Roblox's UV origin is the **top-left** of the image — `v = 0` is the top. Web/GL renderers default to a bottom-left origin (three.js textures default to `flipY = true`). Mismatching this renders every texture upside down — the single most common mistake in external mesh viewers.

The clean pipeline: normalize at parse time to the Roblox convention (v1: `v = 1 - stored_v`; v2+: use the value as stored), then apply exactly one renderer-side policy — either flip V once for all meshes, or disable the renderer's image flip (`texture.flipY = false` in three.js). Do not mix the two or v1 and v2+ assets will disagree.

## Fetching assets

Meshes and textures are served by the v1 asset delivery endpoint:

```text
GET https://assetdelivery.roblox.com/v1/asset/?id=<assetId>
```

Extract the numeric id from content strings (`rbxassetid://123...`, `http://www.roblox.com/asset/?id=123...`) by taking the trailing digits — `str:match("(%d+)%s*$")` in Lua. Skip `rbxasset://` URLs entirely: those are engine-local files shipped with the client, not on the CDN.

> [!NOTE]
> **CSG meshes are not fetchable.** UnionOperation / NegateOperation render meshes are embedded in the place file and have no public asset id. Treat unions as their bounding box (see [part shapes](/docs/roblox/part-shapes)).

### Restricted assets

Experience-restricted assets return **403** without place context. Retry with the `Roblox-Place-Id` header set to the live game's place id (`game.PlaceId`):

```text
GET https://assetdelivery.roblox.com/v1/asset/?id=<assetId>
Roblox-Place-Id: <placeId>
```

Some assets additionally require an authenticated Roblox session on top of the place header.

> [!CAUTION]
> **Treat any auth material as a secret.** Session cookies and tokens must never be written to disk, never logged, never embedded in dump files or exporter output. Keep them in memory for the lifetime of the request and nowhere else. A radar or exporter that persists a session cookie is one stray upload away from a stolen account.

## Official references

- [Roblox FileMesh Format Specification](https://devforum.roblox.com/t/roblox-mesh-format/326114) — the community-maintained spec this page summarizes (v1 V-flip and doubled-vertex quirks are quoted from it)
- [MeshPart](https://create.roblox.com/docs/reference/engine/classes/MeshPart) / [FileMesh](https://create.roblox.com/docs/reference/engine/classes/FileMesh) — class references
- [Texture specifications](https://create.roblox.com/docs/art/modeling/texture-specifications) — official texture/UV conventions
