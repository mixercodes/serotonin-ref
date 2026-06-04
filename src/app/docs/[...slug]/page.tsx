import { notFound } from "next/navigation";
import { PAGES } from "@/lib/pages";
import { fetchPage } from "@/lib/fetcher";
import MarkdownContent from "@/components/MarkdownContent";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return PAGES.map((p) => ({ slug: p.slug.split("/") }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const page = PAGES.find((p) => p.slug === slugStr);
  if (!page) return {};

  // Pull first non-heading, non-empty line from content as description
  let description = `Serotonin Lua API reference for ${page.title}.`;
  try {
    const raw = fetchPage(slugStr);
    const stripped = raw.startsWith("---")
      ? raw.slice(raw.indexOf("\n---", 3) + 4).trimStart()
      : raw;
    const firstPara = stripped
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 20 && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith("```") && !l.startsWith(">"));
    if (firstPara) description = firstPara.replace(/\*\*|`/g, "").slice(0, 160);
  } catch {}

  const title = `${page.title} — Serotonin API Reference`;
  const url = `https://serotonin-ref.vercel.app/docs/${slugStr}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Serotonin API Reference",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function stripFrontmatter(md: string): string {
  if (!md.startsWith("---")) return md;
  const end = md.indexOf("\n---", 3);
  if (end === -1) return md;
  return md.slice(end + 4).trimStart();
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const page = PAGES.find((p) => p.slug === slugStr);
  if (!page) notFound();

  let raw: string;
  try {
    raw = fetchPage(slugStr);
  } catch {
    raw = `> **Error**: Could not load documentation for \`${slugStr}\`. Please try again later.`;
  }

  const content = stripFrontmatter(raw);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[--text-muted] mb-6 font-mono">
          <span className="cursor-default">docs</span>
          {slug.map((part, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-[--bg-border]">/</span>
              <span className={i === slug.length - 1 ? "text-[--accent-light]" : ""}>
                {part}
              </span>
            </span>
          ))}
        </div>

        <MarkdownContent content={content} />

        {/* Prev/Next nav */}
        <div className="mt-12 pt-6 border-t border-bg-border flex items-center justify-between">
          <PrevNext current={slugStr} />
        </div>
      </div>
    </div>
  );
}

function PrevNext({ current }: { current: string }) {
  const idx = PAGES.findIndex((p) => p.slug === current);
  const prev = idx > 0 ? PAGES[idx - 1] : null;
  const next = idx < PAGES.length - 1 ? PAGES[idx + 1] : null;

  return (
    <>
      {prev ? (
        <a
          href={`/docs/${prev.slug}`}
          className="flex items-center gap-2 text-sm text-[--text-muted] hover:text-[--accent-light] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mono">{prev.title}</span>
        </a>
      ) : (
        <div />
      )}
      {next ? (
        <a
          href={`/docs/${next.slug}`}
          className="flex items-center gap-2 text-sm text-[--text-muted] hover:text-[--accent-light] transition-colors"
        >
          <span className="font-mono">{next.title}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ) : (
        <div />
      )}
    </>
  );
}
