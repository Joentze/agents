"use client";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { createBlockMarkdownSpec, Node } from "@tiptap/core";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCwIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMcqStore } from "@/hooks/artifact/components/use-mcq-store";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

const MCQQuestion = ({
  className,
  question,
  options,
  mcqSetId,
  mcqIndex,
}: {
  className?: string;
  question: string;
  options: Array<{ option: string; isCorrect: boolean }>;
  mcqSetId: string;
  mcqIndex: number;
}) => {
  const mcqs = useMcqStore((state) => state.mcqs[mcqSetId] || []);
  const answerMcq = useMcqStore((state) => state.answerMcq);

  const selectedAnswer = mcqs[mcqIndex]?.answeredOption ?? null;
  const hasAnswered = selectedAnswer !== null;

  const handleOptionClick = (index: number) => {
    if (!hasAnswered) {
      answerMcq(mcqSetId, mcqIndex, index);
    }
  };

  const getOptionStyle = (index: number) => {
    if (!hasAnswered) {
      return "hover:bg-accent/30 cursor-pointer";
    }

    if (options[index].isCorrect) {
      return "bg-green-100 dark:bg-green-900/30 border-green-500";
    }

    if (index === selectedAnswer && !options[index].isCorrect) {
      return "bg-red-100 dark:bg-red-900/30 border-red-500";
    }

    return "opacity-50";
  };

  const getOptionIcon = (index: number) => {
    if (!hasAnswered) return null;

    if (options[index].isCorrect) {
      return <Check className="w-5 h-5 text-green-600 dark:text-green-400" />;
    }

    if (index === selectedAnswer && !options[index].isCorrect) {
      return <X className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }

    return null;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-base font-medium min-h-14 line-clamp-2">{question}</p>
      <div className="space-y-2">
        {options.map((opt, index) => (
          <div
            key={index}
            onClick={() => handleOptionClick(index)}
            className={cn(
              "p-4 border-2 border-border rounded-lg transition-all duration-200 flex items-center justify-between",
              getOptionStyle(index)
            )}
          >
            <span className="text-sm flex-1">{opt.option}</span>
            {getOptionIcon(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

const MCQComponent = ({ HTMLAttributes, node }: ReactNodeViewProps) => {
  const { content } = HTMLAttributes;
  const addMcqSet = useMcqStore((state) => state.addMcqSet);
  const mcqs = useMcqStore((state) => state.mcqs);
  const resetMcqSet = useMcqStore((state) => state.resetMcqSet);
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  if (!content) {
    return null;
  }

  const decodedContent = Buffer.from(content, "base64").toString("utf-8");
  const parsedContent: {
    id: string;
    questions: Array<{
      question: string;
      options: Array<{
        option: string;
        isCorrect: boolean;
      }>;
    }>;
  } = JSON.parse(decodedContent);

  // Use content as unique ID for this MCQ set
  const mcqSetId = parsedContent.id;

  // Initialize store with MCQ data if not already present
  useEffect(() => {
    if (!mcqs[mcqSetId]) {
      const mcqData = parsedContent.questions.map((q) => ({
        question: q.question,
        options: q.options,
        answeredOption: null,
      }));
      addMcqSet(mcqSetId, mcqData);
    }
  }, [mcqSetId, mcqs, parsedContent.questions, addMcqSet]);

  return (
    <NodeViewWrapper className="mcq-node my-4 w-full max-w-full">
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
              <MCQQuestion
                question={parsedContent.questions[questionIndex].question}
                options={parsedContent.questions[questionIndex].options}
                mcqSetId={mcqSetId}
                mcqIndex={questionIndex}
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
                  onClick={() => resetMcqSet(mcqSetId)}
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

const MCQNode = Node.create({
  name: "mcq",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      content: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-mcq]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", { "data-mcq": node.attrs.type }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MCQComponent);
  },

  markdownTokenName: "mcq",

  ...createBlockMarkdownSpec({
    allowedAttributes: ["content"],
    nodeName: "mcq",
    name: "mcq",
    content: "block",
  }),
});

export { MCQNode };
