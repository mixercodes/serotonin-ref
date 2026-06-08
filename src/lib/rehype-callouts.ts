import { visit } from "unist-util-visit";

const TYPES = ["note", "tip", "important", "warning", "caution"];

/**
 * GitHub-style admonitions. A blockquote whose first line is `[!WARNING]`
 * (etc.) becomes a typed callout: we strip the marker, tag the node with
 * `data-callout` + `callout callout-<type>` classes, and CSS does the rest.
 * Unmarked blockquotes get `callout callout-default` so every quote renders
 * as a clean callout box.
 */
export default function rehypeCallouts() {
  return (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName !== "blockquote") return;

      const firstPara = node.children.find((c: any) => c.tagName === "p");
      let type: string | null = null;

      if (firstPara && firstPara.children.length) {
        const firstText = firstPara.children[0];
        if (firstText?.type === "text") {
          const m = /^\[!(\w+)\]\s*/i.exec(firstText.value);
          if (m && TYPES.includes(m[1].toLowerCase())) {
            type = m[1].toLowerCase();
            // strip the marker (and any leading newline left behind)
            firstText.value = firstText.value.slice(m[0].length).replace(/^\n+/, "");
            if (firstText.value === "") firstPara.children.shift();
          }
        }
      }

      const cls = type ? `callout callout-${type}` : "callout callout-default";
      node.properties = node.properties || {};
      node.properties.className = cls;
      if (type) node.properties["data-callout"] = type;
    });
  };
}
