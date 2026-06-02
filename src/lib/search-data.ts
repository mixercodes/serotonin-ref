import fs from "fs";
import path from "path";
import { PAGES, type PageSection } from "./pages";

export interface SearchEntry {
  slug: string;
  title: string;
  section: PageSection;
  text: string; // stripped plain text
}

function stripMarkdown(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---\n?/, "")       // frontmatter
    .replace(/```[\s\S]*?```/g, " ")          // code blocks
    .replace(/#{1,6}\s+/g, "")               // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")         // bold
    .replace(/\*(.+?)\*/g, "$1")             // italic
    .replace(/`(.+?)`/g, "$1")              // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/[|>]/g, " ")                   // tables / blockquotes
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchIndex(): SearchEntry[] {
  const contentDir = path.join(process.cwd(), "src", "content");
  return PAGES.map((page) => {
    const file = path.join(contentDir, `${page.slug}.md`);
    let text = "";
    try {
      text = stripMarkdown(fs.readFileSync(file, "utf-8"));
    } catch {
      // file missing — still include page with empty text
    }
    return { slug: page.slug, title: page.title, section: page.section, text };
  });
}
