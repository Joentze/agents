import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { createBlockMarkdownSpec, Node } from "@tiptap/core";

const CalloutComponent = ({ HTMLAttributes }: ReactNodeViewProps) => {
  const { type, content } = HTMLAttributes;
  console.log(type);
  if (!content) {
    return null;
  }
  const decodedContent = Buffer.from(content, "base64").toString("utf-8");
  const parsedContent = JSON.parse(decodedContent);
  console.log(parsedContent);

  return <NodeViewWrapper className="callout-node"></NodeViewWrapper>;
};

const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      content: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", { "data-callout": node.attrs.type }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },

  markdownTokenName: "callout",

  ...createBlockMarkdownSpec({
    allowedAttributes: ["content"],
    nodeName: "callout",
    name: "callout",
    content: "block",
  }),
});

export { Callout };
