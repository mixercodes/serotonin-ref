import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import Search from "@/components/Search";
import { buildSearchIndex } from "@/lib/search-data";

export const metadata: Metadata = {
  title: "Serotonin API Reference",
  description:
    "Lua API reference for the Serotonin scripting runtime — 14 libraries, 5 userdata types, runtime-verified. Available as an MCP server.",
  metadataBase: new URL("https://serotonin-ref.vercel.app"),
  openGraph: {
    title: "Serotonin API Reference",
    description: "Lua API reference for the Serotonin scripting runtime.",
    type: "website",
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
          <TopNav searchIndex={searchIndex} />
          {children}
        </div>
        <Search index={searchIndex} />
      </body>
    </html>
  );
}
