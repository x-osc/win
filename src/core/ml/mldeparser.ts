import type { MlNode } from "./mlparser";
import { unwraploc, type Located } from "./parser";

// generator

export function generateHTML(nodes: Located<MlNode>[]): string {
  return nodes
    .map((locnode) => {
      const node = unwraploc(locnode);
      if (node.type === "text") {
        return node.content;
      }

      const attrString = node.attributes
        .map(({ key, value }) =>
          unwraploc(value) === true
            ? ` ${unwraploc(key)}`
            : ` ${unwraploc(key)}="${unwraploc(value)}"`,
        )
        .join("");

      const childrenString = generateHTML(node.children);
      return `<${node.tag.value}${attrString}>${childrenString}</${node.tag.value}>`;
    })
    .join("");
}
