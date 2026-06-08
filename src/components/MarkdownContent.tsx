"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeCallouts from "@/lib/rehype-callouts";

interface Props {
  content: string;
}

function applySearchHighlights(query: string): () => void {
  const q = query.trim();
  if (!q) return () => {};

  const container = document.querySelector(".prose");
  if (!container) return () => {};

  const marked: HTMLElement[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const el = (node as Text).parentElement;
      // Skip code blocks and the code-block chrome (lang label / copy button)
      if (el?.closest("pre") || el?.closest(".code-block-header")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) textNodes.push(n as Text);

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? "";
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) continue;
    try {
      const range = document.createRange();
      range.setStart(textNode, idx);
      range.setEnd(textNode, idx + q.length);
      const mark = document.createElement("mark");
      mark.className = "search-term-highlight";
      range.surroundContents(mark);
      marked.push(mark);
    } catch {
      // surroundContents throws on cross-element ranges — skip
    }
  }

  return () => {
    for (const mark of marked) {
      const parent = mark.parentNode;
      if (!parent) continue;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    }
  };
}

/* ── Code block with language label + copy button ──────────────── */
function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  // language comes from the child <code class="language-xxx hljs">
  let lang = "";
  const child = Array.isArray(children) ? children[0] : children;
  const cls = (child as any)?.props?.className as string | undefined;
  const m = cls && /language-(\w+)/.exec(cls);
  if (m) lang = m[1];

  const copy = () => {
    const text = ref.current?.innerText ?? "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-lang">{lang || "code"}</span>
        <button onClick={copy} className="code-copy" aria-label="Copy code">
          {copied ? (
            <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9 10 3" stroke="var(--accent-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>copied</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="3" y="3" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 7.5V2.5a1 1 0 011-1H7" stroke="currentColor" strokeWidth="1.2"/></svg>copy</>
          )}
        </button>
      </div>
      <pre ref={ref} {...props}>{children}</pre>
    </div>
  );
}

function Heading({ level, children, id, ...props }: { level: 2 | 3 | 4; id?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) {
  const Tag = `h${level}` as "h2" | "h3" | "h4";
  return (
    <Tag id={id} {...props}>
      {children}
      {id && (
        <a href={`#${id}`} className="heading-anchor" aria-label="Link to this section">#</a>
      )}
    </Tag>
  );
}

export default function MarkdownContent({ content }: Props) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const query = sessionStorage.getItem("search-query") ?? "";
    sessionStorage.removeItem("search-query");

    let cleanup: (() => void) | undefined;

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        cleanup = applySearchHighlights(query);
        const firstMark = document.querySelector("mark.search-term-highlight");
        if (firstMark) {
          firstMark.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (hash) {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [content]);

  return (
    <div className="prose prose-invert prose-sm md:prose-base max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeCallouts, rehypeHighlight]}
        components={{
          pre: CodeBlock as any,
          h2: (p) => <Heading level={2} {...(p as any)} />,
          h3: (p) => <Heading level={3} {...(p as any)} />,
          h4: (p) => <Heading level={4} {...(p as any)} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
