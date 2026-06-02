"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";

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
      // Skip text inside code blocks (pre > code), allow inline code
      if ((node as Text).parentElement?.closest("pre")) return NodeFilter.FILTER_REJECT;
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

export default function MarkdownContent({ content }: Props) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const query = sessionStorage.getItem("search-query") ?? "";
    sessionStorage.removeItem("search-query");

    let cleanup: (() => void) | undefined;

    // setTimeout yields past Next.js's own post-navigation scroll reset;
    // rAF inside ensures the browser has painted the new content.
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
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
