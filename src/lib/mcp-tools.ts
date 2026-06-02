import { fetchPage } from "./fetcher";
import { PAGES } from "./pages";

type Locale = "en" | "ru";

function clampLocale(input?: string): Locale {
  return input === "ru" ? "ru" : "en";
}

function resolveSlug(library: string): string | undefined {
  if (PAGES.find((p) => p.slug === library)) return library;
  for (const prefix of ["libraries", "userdata", "tools"]) {
    const candidate = `${prefix}/${library}`;
    if (PAGES.find((p) => p.slug === candidate)) return candidate;
  }
}

export function listPages(args: { locale?: string } = {}) {
  void clampLocale(args.locale);
  return PAGES.map((p) => ({ slug: p.slug, title: p.title, section: p.section }));
}

export function readPage(args: { slug?: string; locale?: string }) {
  if (typeof args.slug !== "string" || !args.slug) {
    throw new Error("read_page: 'slug' is required");
  }
  const locale = clampLocale(args.locale);
  const known = PAGES.find((p) => p.slug === args.slug);
  if (!known) {
    const available = PAGES.map((p) => p.slug).join(", ");
    throw new Error(`read_page: unknown slug '${args.slug}'. Known: ${available}`);
  }
  return fetchPage(args.slug, locale);
}

export function searchPages(args: { query?: string; locale?: string }) {
  if (typeof args.query !== "string" || !args.query) {
    throw new Error("search_pages: 'query' is required");
  }
  const locale = clampLocale(args.locale);
  const q = args.query.toLowerCase();
  const hits: Array<{
    slug: string;
    title: string;
    section: string;
    title_match: boolean;
    snippet: string;
  }> = [];

  for (const p of PAGES) {
    const titleMatch = p.title.toLowerCase().includes(q);
    let bodyMatch = false;
    let snippet = "";
    try {
      const body = fetchPage(p.slug, locale);
      const idx = body.toLowerCase().indexOf(q);
      if (idx !== -1) {
        bodyMatch = true;
        const start = Math.max(0, idx - 80);
        const end = Math.min(body.length, idx + q.length + 80);
        snippet = body.slice(start, end).replace(/\s+/g, " ").trim();
        if (start > 0) snippet = "..." + snippet;
        if (end < body.length) snippet = snippet + "...";
      }
    } catch {
      // page missing, skip body match
    }
    if (titleMatch || bodyMatch) {
      hits.push({
        slug: p.slug,
        title: p.title,
        section: p.section,
        title_match: titleMatch,
        snippet: snippet || `(matched in title) ${p.title}`,
      });
    }
  }
  return { query: args.query, locale, hits };
}

export function getFunction(args: {
  library?: string;
  name?: string;
  locale?: string;
}) {
  if (typeof args.library !== "string" || !args.library) {
    throw new Error("get_function: 'library' is required (e.g. 'memory', 'utility', 'ui')");
  }
  if (typeof args.name !== "string" || !args.name) {
    throw new Error("get_function: 'name' is required");
  }
  const locale = clampLocale(args.locale);
  const slug = resolveSlug(args.library);
  if (!slug) throw new Error(`get_function: unknown library '${args.library}'`);

  const body = fetchPage(slug, locale);
  const lines = body.split("\n");
  const target = args.name.toLowerCase();

  const isHeader = (line: string): boolean => {
    if (!line.startsWith("## ")) return false;
    const labels = Array.from(line.matchAll(/`([\w]+)`/g)).map((m) =>
      m[1].toLowerCase()
    );
    return labels.includes(target);
  };

  let i = 0;
  while (i < lines.length && !isHeader(lines[i])) i++;
  if (i === lines.length) {
    throw new Error(
      `get_function: function '${args.name}' not found on page ${slug}. ` +
        `Use list_functions to see what's available.`
    );
  }
  const start = i;
  let end = i + 1;
  while (end < lines.length && !lines[end].startsWith("## ")) end++;
  return lines.slice(start, end).join("\n").trim();
}

export function listFunctions(args: { library?: string; locale?: string }) {
  if (typeof args.library !== "string" || !args.library) {
    throw new Error("list_functions: 'library' is required (e.g. 'draw', 'entity', 'Vector3')");
  }
  const locale = clampLocale(args.locale);
  const slug = resolveSlug(args.library);
  if (!slug) throw new Error(`list_functions: unknown library '${args.library}'`);

  const body = fetchPage(slug, locale);
  const lines = body.split("\n");
  const functions: Array<{ name: string; description: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("## ")) continue;
    const backtick = lines[i].match(/##\s+`([^`]+)`/);
    if (!backtick) continue; // skip prose section headers — only index backtick-named entries
    const name = backtick[1];

    // First prose line after the heading (skip code blocks, blank lines, tables, rules)
    let description = "";
    let inCode = false;
    for (let j = i + 1; j < lines.length && !lines[j].startsWith("## "); j++) {
      const ln = lines[j].trim();
      if (ln.startsWith("```")) { inCode = !inCode; continue; }
      if (inCode || !ln || ln.startsWith("|") || ln === "---") continue;
      description = ln;
      break;
    }

    functions.push({ name, description });
  }

  return { library: slug, count: functions.length, functions };
}

export function lookup(args: { fn?: string; locale?: string }) {
  if (typeof args.fn !== "string" || !args.fn) {
    throw new Error("lookup: 'fn' is required (e.g. 'utility.GetTickCount')");
  }
  const dot = args.fn.indexOf(".");
  if (dot === -1) {
    throw new Error("lookup: 'fn' must be in 'library.FunctionName' format");
  }
  return getFunction({
    library: args.fn.slice(0, dot),
    name:    args.fn.slice(dot + 1),
    locale:  args.locale,
  });
}
