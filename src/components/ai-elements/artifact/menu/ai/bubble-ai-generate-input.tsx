import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { InputGroupInput } from "@/components/ui/input-group";
import { InputGroupButton } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { useCompletion } from "@ai-sdk/react";
import { Editor } from "@tiptap/react";
import { ArrowUp, ListCheck, SwatchBook, Sparkle, PenBox } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { diffChars } from "diff";
import { type DiffSegment, generateId } from "../../custom/ai-diff-node";
export type BubbleMenuAIGenerateOptions =
  | "content"
  | "flash-cards"
  | "mcqs"
  | "open-ended";

// Highlight colors matching the AI style options (using semi-transparent versions for better readability)
export const AIHighlightColors: Record<BubbleMenuAIGenerateOptions, string> = {
  content: "rgba(99, 102, 241, 0.3)", // indigo-500 with 30% opacity
  "flash-cards": "rgba(249, 115, 22, 0.3)", // orange-500 with 30% opacity
  mcqs: "rgba(34, 197, 94, 0.3)", // green-500 with 30% opacity
  "open-ended": "rgba(234, 179, 8, 0.3)", // yellow-500 with 30% opacity
};

const AIStyleOptions: Record<
  BubbleMenuAIGenerateOptions,
  {
    label: string;
    icon: React.ReactNode;
    borderColor: string;
    ringColor: string;
  }
> = {
  content: {
    label: "Content",
    icon: <Sparkle className="size-3 text-indigo-500" />,
    borderColor: "border-indigo-500",
    ringColor: "ring-indigo-500",
  },
  "flash-cards": {
    label: "Flash Cards",
    icon: <SwatchBook className="size-3 text-orange-500" />,
    borderColor: "border-orange-500",
    ringColor: "ring-orange-500",
  },
  mcqs: {
    label: "MCQs",
    icon: <ListCheck className="size-3 text-green-500" />,
    borderColor: "border-green-500",
    ringColor: "ring-green-500",
  },
  "open-ended": {
    label: "Open-Ended",
    icon: <PenBox className="size-3 text-yellow-500" />,
    borderColor: "border-yellow-500",
    ringColor: "ring-yellow-500",
  },
};
export function BubbleAIGenerateInput({
  option,
  editor,
}: {
  editor: Editor;
  option: BubbleMenuAIGenerateOptions;
}) {
  const textInputRef = useRef<HTMLInputElement>(null);

  const { complete, isLoading } = useCompletion({
    api: "/api/artifact/content",
  });

  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  const handleComplete = async ({ prompt }: { prompt: string }) => {
    const { from, to } = editor.state.selection;

    editor.commands.unsetHighlight();
    const slice = editor.state.doc.slice(from, to);

    // Convert Slice → JSON document structure for serialization
    const json = {
      type: "doc",
      content: slice.content.toJSON(),
    };

    // Serialize JSON → Markdown
    const markdown = editor.markdown?.serialize(json) || "";

    const sendPrompt = `${markdown}\n\n${prompt}`;
    const completed = await complete(sendPrompt);
    const charDiffs = diffChars(markdown, completed || "");

    // Convert diff results to our DiffSegment format
    const diffs: DiffSegment[] = charDiffs
      .filter((diff) => diff.value) // Skip empty values
      .map((diff) => ({
        type: diff.added ? "added" : diff.removed ? "removed" : "unchanged",
        value: diff.value,
      }));

    // Delete the original selection first
    editor.chain().focus().deleteRange({ from, to }).run();

    // Insert the AI Diff node with approve/reject functionality
    editor
      .chain()
      .focus()
      .insertContentAt(from, {
        type: "aiDiff",
        attrs: {
          id: generateId(),
          originalContent: markdown,
          newContent: completed || "",
          diffs,
        },
      })
      .run();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <InputGroup
        className={cn(
          "rounded-full w-72",
          AIStyleOptions[option].borderColor,
          AIStyleOptions[option].ringColor
        )}
      >
        <InputGroupAddon>{AIStyleOptions[option].icon}</InputGroupAddon>
        <InputGroupInput
          placeholder={`Generate ${AIStyleOptions[option].label}`}
          ref={textInputRef}
        ></InputGroupInput>
        <InputGroupButton
          size={"icon-sm"}
          className="rounded-full"
          onClick={async () =>
            await handleComplete({ prompt: textInputRef.current?.value || "" })
          }
        >
          <ArrowUp className="size-3" />
        </InputGroupButton>
      </InputGroup>
    </motion.div>
  );
}
