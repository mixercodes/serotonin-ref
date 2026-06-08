import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base:     "var(--bg-base)",
          surface:  "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          border:   "var(--bg-border)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          light:   "var(--accent-light)",
          2:       "var(--accent-2)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      typography: {
        invert: {
          css: {
            "--tw-prose-body":         "var(--text)",
            "--tw-prose-headings":     "var(--text-heading)",
            "--tw-prose-lead":         "var(--text-muted)",
            "--tw-prose-links":        "var(--accent-light)",
            "--tw-prose-bold":         "var(--text-heading)",
            "--tw-prose-counters":     "var(--text-muted)",
            "--tw-prose-bullets":      "var(--text-muted)",
            "--tw-prose-hr":           "var(--bg-border)",
            "--tw-prose-quotes":       "var(--text)",
            "--tw-prose-quote-borders":"var(--accent)",
            "--tw-prose-captions":     "var(--text-muted)",
            "--tw-prose-code":         "var(--accent-light)",
            "--tw-prose-pre-code":     "var(--text)",
            "--tw-prose-pre-bg":       "var(--bg-surface)",
            "--tw-prose-th-borders":   "var(--bg-border)",
            "--tw-prose-td-borders":   "var(--bg-border)",
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
