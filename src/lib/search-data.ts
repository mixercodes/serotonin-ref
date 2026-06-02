import fs from "fs";
import path from "path";
import { PAGES, type PageSection } from "./pages";

export interface SearchEntry {
  slug: string;
  title: string;
  section: PageSection;
  text: string;
  anchor?: string;
}

/** Match what rehype-slug (github-slugger) produces for heading text content. */
function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[`*_[\]()]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function stripFormatting(text: string): string {
  return text
    .replace(/[`*_]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function stripMarkdown(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---\n?/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[|>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchIndex(): SearchEntry[] {
  const contentDir = path.join(process.cwd(), "src", "content");
  const entries: SearchEntry[] = [];

  for (const page of PAGES) {
    const file = path.join(contentDir, `${page.slug}.md`);
    let raw = "";
    try {
      raw = fs.readFileSync(file, "utf-8");
    } catch {
      entries.push({ slug: page.slug, title: page.title, section: page.section, text: "" });
      continue;
    }

    const content = raw.replace(/^---[\s\S]*?---\n?/, "");

    // Collect positions of all h2/h3 headings (outside code blocks)
    const headings: Array<{ title: string; anchor: string; index: number; lineEnd: number }> = [];
    const headingRe = /^#{2,3}\s+(.+)$/gm;
    let m: RegExpExecArray | null;
    while ((m = headingRe.exec(content)) !== null) {
      headings.push({
        title: stripFormatting(m[1]),
        anchor: slugify(m[1]),
        index: m.index,
        lineEnd: m.index + m[0].length,
      });
    }

    if (headings.length === 0) {
      // No sub-headings — index the whole page as one entry
      const text = stripMarkdown(content);
      if (text) entries.push({ slug: page.slug, title: page.title, section: page.section, text });
      continue;
    }

    // Page intro (text before first heading)
    const intro = stripMarkdown(content.slice(0, headings[0].index));
    if (intro) {
      entries.push({ slug: page.slug, title: page.title, section: page.section, text: intro });
    }

    // One entry per heading
    for (let i = 0; i < headings.length; i++) {
      const { title, anchor, lineEnd } = headings[i];
      const bodyEnd = i + 1 < headings.length ? headings[i + 1].index : content.length;
      const text = stripMarkdown(content.slice(lineEnd, bodyEnd));
      entries.push({ slug: page.slug, title, section: page.section, text, anchor });
    }
  }

  return entries;
}
