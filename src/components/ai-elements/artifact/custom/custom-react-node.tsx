import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { createBlockMarkdownSpec, Node } from "@tiptap/core";

const CustomReactComponent = ({ node }: any) => {
  return (
    <NodeViewWrapper className="custom-react-node">
      <div
        style={{
          border: "2px solid #3b82f6",
          borderRadius: "8px",
          padding: "16px",
          margin: "8px 0",
          backgroundColor: "#eff6ff",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>
          Custom React Component
        </h4>
        <p style={{ margin: 0, color: "#374151" }}>
          {node.attrs.content || "This is a custom React node view!"}
        </p>
        <div>
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

const CustomReactNode = Node.create({
  name: "react",

  group: "block",
  content: "block+",

  addAttributes() {
    return {
      content: {
        default: "This is a custom React node view!",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='react']" }];
  },

  renderHTML({ node }) {
    return ["div", { "data-type": "react" }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomReactComponent);
  },

  markdownTokenName: "react",

  ...createBlockMarkdownSpec({
    allowedAttributes: ["content"],
    nodeName: "react",
    name: "react",
    content: "block",
  }),
});

export { CustomReactNode };
