import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BuildInfo from "@/components/BuildInfo";
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

const themeScript = `(function(){var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'default');})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const searchIndex = buildSearchIndex();

  return (
    <html lang="en" className="h-dvh overscroll-none">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex h-dvh overflow-hidden overscroll-none bg-bg-base">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <BuildInfo />
          {children}
        </div>
        <Search index={searchIndex} />
      </body>
    </html>
  );
}
