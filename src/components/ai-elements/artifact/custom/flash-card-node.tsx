"use client";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { createBlockMarkdownSpec, Node } from "@tiptap/core";
import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

const FlashCard = ({
  question,
  answer,
  className,
}: {
  question: string;
  answer: string;
  className?: string;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div onClick={() => setIsFlipped(!isFlipped)} className={cn(className)}>
      <div
        className="relative w-96 mx-auto h-64 transition-transform duration-500 preserve-3d"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0 p-6 border-2 ring ring-border/50 border-border bg-accent/10 hover:bg-accent/30 cursor-pointer transition-all duration-200 rounded-lg flex items-center justify-center text-center backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-base font-medium">{question}</p>
        </div>
        {/* Back of card */}
        <div
          className="absolute inset-0 p-6 border-2 ring ring-border/50 border-border hover:bg-accent/30 cursor-pointer transition-all duration-200 rounded-lg flex items-center justify-center text-center backface-hidden bg-accent/10"
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

const FlashCardComponent = ({ node }: ReactNodeViewProps) => {
  const flashCardContent = node.content.toJSON()[0].content[0].text;

  const [cardIndex, setCardIndex] = useState<number>(0);

  if (!flashCardContent) {
    return null;
  }

  const parsedContent: {
    title: string;
    cards: Array<{ question: string; answer: string }>;
  } = JSON.parse(flashCardContent);

  const handleReset = () => {
    setCardIndex(0);
  };

  return (
    <NodeViewWrapper className="flash-card-node my-4 w-full max-w-full">
      <div className="space-y-6 flex-1">
        {parsedContent.title && (
          <p className="text-xs text-muted-foreground px-4">
            {parsedContent.title}
          </p>
        )}
        <div className="space-y-6">
          <div
            key={cardIndex}
            className="border border-border ring-2 ring-border/50 rounded-lg bg-accent/30 flex flex-col"
          >
            <motion.div
              key={cardIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <FlashCard
                question={parsedContent.cards[cardIndex].question}
                answer={parsedContent.cards[cardIndex].answer}
                className="p-4"
              />
            </motion.div>
            <div className="mx-auto text-xs font-medium text-muted-foreground my-2 mb-3">
              {cardIndex + 1} of {parsedContent.cards.length}
            </div>
            <div className="border-t border-border p-4 flex justify-center items-center bg-accent/10">
              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCardIndex(cardIndex - 1)}
                  disabled={cardIndex === 0}
                >
                  <ChevronLeft />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Go to first card"
                >
                  <RotateCcw />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCardIndex(cardIndex + 1)}
                  disabled={cardIndex === parsedContent.cards.length - 1}
                >
                  <ChevronRight />
                </Button>
              </ButtonGroup>
            </div>
          </div>
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
