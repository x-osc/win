import type { MlNode } from "./mlparser";

export function generateHTML(nodes: MlNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return node.content;
      }

      const attrEntries = Object.entries(node.attributes);
      const attrString = attrEntries
        .map(([key, value]) => (value === true ? key : `${key}="${value}"`))
        .join(" ");

      const childrenString = generateHTML(node.children);
      return `<${node.tag} ${attrString}>${childrenString}</${node.tag}>`;
    })
    .join("");
}
