"use client";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { createBlockMarkdownSpec, Node } from "@tiptap/core";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PencilLineIcon,
  RefreshCwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

const OpenEndedQuestion = ({
  className,
  question,
  placeholder,
}: {
  className?: string;
  question: string;
  placeholder?: string;
}) => {
  const [answer, setAnswer] = useState<string>("");

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-base font-medium min-h-14 ">{question}</p>
      <div className="space-y-2">
        <InputGroup>
          <InputGroupAddon align="block-end">
            <InputGroupButton
              size={"icon-xs"}
              variant={"outline"}
              className="rounded-full"
            >
              <PencilLineIcon className="size-3" />
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupTextarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={placeholder || "Type your answer here..."}
            className="min-h-24 resize-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </InputGroup>
        <div className="h-7 flex justify-between items-center text-xs text-muted-foreground ">
          <span className="my-auto">{answer.length} characters</span>
          {answer.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnswer("")}
              className="h-7 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const OpenEndedComponent = ({ node }: ReactNodeViewProps) => {
  const openEndedContent = node.content.toJSON()[0].content[0].text;
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  if (!openEndedContent) {
    return null;
  }

  const parsedContent: {
    id: string;
    questions: Array<{
      question: string;
      placeholder?: string;
    }>;
  } = JSON.parse(openEndedContent);

  const handleReset = () => {
    // TODO: Reset all answers in store
    setQuestionIndex(0);
  };

  return (
    <NodeViewWrapper className="open-ended-node my-4 w-full max-w-full">
      <div className="space-y-6 flex-1">
        <div className="space-y-6">
          <div
            key={questionIndex}
            className="border border-border ring-2 ring-border/50 rounded-lg bg-accent/30 flex flex-col"
          >
            <div className="text-xs text-muted-foreground px-4 pt-4 -mb-4">
              Question {questionIndex + 1}
            </div>
            <motion.div
              key={questionIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <OpenEndedQuestion
                question={parsedContent.questions[questionIndex].question}
                placeholder={parsedContent.questions[questionIndex].placeholder}
                className="p-4 pb-1"
              />
            </motion.div>
            <div className="mx-auto text-xs font-medium text-muted-foreground my-2 mb-3">
              {questionIndex + 1} of {parsedContent.questions.length}
            </div>
            <div className="border-t border-border p-4 flex justify-center items-center bg-accent/10">
              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuestionIndex(questionIndex - 1)}
                  disabled={questionIndex === 0}
                >
                  <ChevronLeft />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Reset all answers"
                >
                  <RefreshCwIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuestionIndex(questionIndex + 1)}
                  disabled={
                    questionIndex === parsedContent.questions.length - 1
                  }
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

const OpenEndedNode = Node.create({
  name: "openended",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      content: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-openended]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", { "data-openended": node.attrs.type }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(OpenEndedComponent);
  },

  markdownTokenName: "openended",

  ...createBlockMarkdownSpec({
    allowedAttributes: ["content"],
    nodeName: "openended",
    name: "openended",
    content: "block",
  }),
});

export { OpenEndedNode };
