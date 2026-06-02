import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

export function fetchPage(slug: string, _locale = "en"): string {
  const file = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) {
    throw new Error(`Page not found: ${slug}`);
  }
  return fs.readFileSync(file, "utf-8");
}
