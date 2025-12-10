import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { createBlockMarkdownSpec, Node } from "@tiptap/core";
import { useState } from "react";

const FlashCard = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div onClick={() => setIsFlipped(!isFlipped)}>
      <div
        className="relative w-81 h-52 transition-transform duration-500 preserve-3d"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0 p-4 border-2 ring ring-border/50 border-border bg-accent/10 hover:bg-accent/30 cursor-pointer transition-all duration-200 rounded-lg flex items-center justify-center text-center backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-sm font-medium">{question}</p>
        </div>
        {/* Back of card */}
        <div
          className="absolute inset-0 p-4 border-2 ring ring-border/50 border-border hover:bg-accent/30 cursor-pointer transition-all duration-200 rounded-lg flex items-center justify-center text-center backface-hidden bg-accent/10"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p className="text-sm">{answer}</p>
        </div>
      </div>
    </div>
  );
};

const FlashCardComponent = ({ HTMLAttributes }: ReactNodeViewProps) => {
  const { type, content } = HTMLAttributes;
  console.log(type);
  if (!content) {
    return null;
  }
  const decodedContent = Buffer.from(content, "base64").toString("utf-8");
  const parsedContent: {
    title: string;
    cards: Array<{ question: string; answer: string }>;
  } = JSON.parse(decodedContent);

  return (
    <NodeViewWrapper className="flash-card-node my-4">
      <div className="space-y-4 flex-1">
        {parsedContent.title && (
          <p className="text-xs text-muted-foreground">{parsedContent.title}</p>
        )}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {parsedContent.cards.map((card, index) => (
            <FlashCard
              key={index}
              question={card.question}
              answer={card.answer}
            />
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

const FlashCardNode = Node.create({
  name: "flashcard",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      content: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-flashcard]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", { "data-flashcard": node.attrs.type }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FlashCardComponent);
  },

  markdownTokenName: "flashcard",

  ...createBlockMarkdownSpec({
    allowedAttributes: ["content"],
    nodeName: "flashcard",
    name: "flashcard",
    content: "block",
  }),
});

export { FlashCardNode };
