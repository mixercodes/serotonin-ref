export type PageSection = "foundation" | "library" | "userdata" | "roblox" | "tool";

export interface DocPage {
  slug: string;
  title: string;
  section: PageSection;
}

export const PAGES: DocPage[] = [
  // Foundation
  { slug: "quick-start", title: "Quick start", section: "foundation" },
  { slug: "pitfalls", title: "Pitfalls", section: "foundation" },
  { slug: "audit-notes", title: "Audit notes", section: "foundation" },
  { slug: "mcp-ai-setup", title: "MCP / AI setup", section: "foundation" },
  // Libraries
  { slug: "libraries/utility", title: "utility", section: "library" },
  { slug: "libraries/memory", title: "memory", section: "library" },
  { slug: "libraries/entity", title: "entity", section: "library" },
  { slug: "libraries/game", title: "game", section: "library" },
  { slug: "libraries/cheat", title: "cheat", section: "library" },
  { slug: "libraries/bit", title: "bit", section: "library" },
  { slug: "libraries/file", title: "file", section: "library" },
  { slug: "libraries/audio", title: "audio", section: "library" },
  { slug: "libraries/mouse", title: "mouse", section: "library" },
  { slug: "libraries/keyboard", title: "keyboard", section: "library" },
  { slug: "libraries/http", title: "http", section: "library" },
  { slug: "libraries/websocket", title: "websocket", section: "library" },
  { slug: "libraries/draw", title: "draw", section: "library" },
  { slug: "libraries/ui", title: "ui", section: "library" },
  // Userdata
  { slug: "userdata/Vector3", title: "Vector3", section: "userdata" },
  { slug: "userdata/Color3", title: "Color3", section: "userdata" },
  { slug: "userdata/Instance", title: "Instance", section: "userdata" },
  { slug: "userdata/Part", title: "Part", section: "userdata" },
  { slug: "userdata/Player", title: "Player", section: "userdata" },
  // Roblox engine internals (runtime-verified domain knowledge)
  { slug: "roblox/hidden-properties", title: "Hidden properties", section: "roblox" },
  { slug: "roblox/part-shapes", title: "Part shapes", section: "roblox" },
  { slug: "roblox/classic-meshes", title: "Classic meshes", section: "roblox" },
  { slug: "roblox/mesh-formats", title: "Mesh file formats", section: "roblox" },
  { slug: "roblox/surfaces-decals", title: "Surfaces & decals", section: "roblox" },
  { slug: "roblox/character-rigs", title: "Character rigs", section: "roblox" },
  // Tools
  { slug: "tools/agent", title: "Agent", section: "tool" },
];

export function pagesBySection(): Record<PageSection, DocPage[]> {
  const out: Record<PageSection, DocPage[]> = {
    foundation: [],
    library: [],
    userdata: [],
    roblox: [],
    tool: [],
  };
  for (const p of PAGES) out[p.section].push(p);
  return out;
}
