import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import Search from "@/components/Search";
import { buildSearchIndex } from "@/lib/search-data";

export const metadata: Metadata = {
  title: "Serotonin API Reference",
  description:
    "Lua API reference for the Serotonin scripting runtime — 17 libraries, 130 functions, runtime-verified. Available as an MCP server.",
  metadataBase: new URL("https://serotonin-ref.vercel.app"),
  openGraph: {
    title: "Serotonin API Reference",
    description: "Lua API reference for the Serotonin scripting runtime.",
    type: "website",
  },
};

const themeScript = `(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const searchIndex = buildSearchIndex();

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex h-screen overflow-hidden bg-bg-base">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNav searchIndex={searchIndex} />
          {children}
        </div>
        <Search index={searchIndex} />
      </body>
    </html>
  );
}
