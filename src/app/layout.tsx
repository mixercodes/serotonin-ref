import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageTransition from "@/components/PageTransition";
import Search from "@/components/Search";
import { buildSearchIndex } from "@/lib/search-data";

const BASE_URL = "https://serotonin-ref.vercel.app";
const BASE_DESC = "Runtime-verified Lua API reference for the Serotonin scripting runtime. Available as an MCP server.";

export const metadata: Metadata = {
  title: "Serotonin API Reference",
  description: BASE_DESC,
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Serotonin API Reference",
    description: BASE_DESC,
    url: BASE_URL,
    siteName: "Serotonin API Reference",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Serotonin API Reference",
    description: BASE_DESC,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const searchIndex = buildSearchIndex();

  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const date = new Date().toISOString().slice(0, 10);
  const buildLabel = sha ? `${sha} · ${date}` : "dev build";

  return (
    <html lang="en" className="h-dvh overscroll-none" data-theme="default" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex h-dvh overflow-hidden overscroll-none bg-bg-base">
        <div className="ambient-glow" aria-hidden="true" />
        <Sidebar buildLabel={buildLabel} />
        <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
          <Breadcrumbs />
          <PageTransition>{children}</PageTransition>
        </div>
        <Search index={searchIndex} />
      </body>
    </html>
  );
}
