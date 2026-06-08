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
      <div className="max-w-5xl mx-auto px-5 md:px-8 lg:px-12 pt-16 pb-16">
        <MarkdownContent content={content} />

        {/* Prev/Next nav */}
        <div className="mt-14 pt-6 border-t border-bg-border flex items-center justify-between gap-4">
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
          className="group flex items-center gap-3 rounded-xl border border-bg-border bg-bg-surface/40 px-4 py-3 transition-all hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-bg-elevated/60 hover:-translate-y-0.5"
        >
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="text-[--text-muted] transition-transform group-hover:-translate-x-0.5 group-hover:text-[--accent-light]">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-left">
            <span className="block text-[10px] uppercase tracking-widest text-[--text-faint]">Previous</span>
            <span className="block font-mono text-sm text-[--text] group-hover:text-[--accent-light] transition-colors">{prev.title}</span>
          </span>
        </a>
      ) : (
        <div />
      )}
      {next ? (
        <a
          href={`/docs/${next.slug}`}
          className="group flex items-center gap-3 rounded-xl border border-bg-border bg-bg-surface/40 px-4 py-3 text-right transition-all hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-bg-elevated/60 hover:-translate-y-0.5"
        >
          <span className="text-right">
            <span className="block text-[10px] uppercase tracking-widest text-[--text-faint]">Next</span>
            <span className="block font-mono text-sm text-[--text] group-hover:text-[--accent-light] transition-colors">{next.title}</span>
          </span>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="text-[--text-muted] transition-transform group-hover:translate-x-0.5 group-hover:text-[--accent-light]">
            <path d="M5 2l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ) : (
        <div />
      )}
    </>
  );
}
