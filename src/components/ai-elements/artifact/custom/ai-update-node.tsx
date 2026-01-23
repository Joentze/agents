"use client";

import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import { Check, X, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useEffect } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { getEditor } from "../artifact-renderer";

type UpdateType = "added" | "removed";

interface AIUpdateNodeAttrs {
  id: string;
  type: UpdateType;
  content: string;
}

const AIUpdateComponent = ({ node, editor, getPos }: ReactNodeViewProps) => {
  const attrs = node.attrs as AIUpdateNodeAttrs;
  const { type, content } = attrs;
  const updateEditor = getEditor();

  const isAdded = type === "added";
  const isRemoved = type === "removed";

  // Set up the preview editor content
  useEffect(() => {
    if (updateEditor) {
      updateEditor.commands.setContent(content, {
        emitUpdate: false,
        contentType: "markdown",
      });
    }
  }, [content, updateEditor]);

  // Helper to insert markdown content at a position
  const insertMarkdownAt = (pos: number, markdown: string) => {
    const parsedDoc = editor.markdown?.parse(markdown);

    if (parsedDoc && parsedDoc.content) {
      editor
        .chain()
        .focus()
        .insertContentAt(pos, parsedDoc.content, {
          updateSelection: true,
        })
        .run();
    } else {
      editor.chain().focus().insertContentAt(pos, markdown).run();
    }
  };

  const deleteNode = () => {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos === undefined) return;

    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .run();
  };

  const handleAccept = () => {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos === undefined) return;

    if (isAdded) {
      // Accept addition: delete this node and insert the content
      deleteNode();
      insertMarkdownAt(pos, content);
    } else {
      // Accept removal: just delete this node (content is already removed)
      deleteNode();
    }
  };

  const handleReject = () => {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos === undefined) return;

    if (isAdded) {
      // Reject addition: just delete this node (don't add the content)
      deleteNode();
    } else {
      // Reject removal: delete this node and restore the content
      deleteNode();
      insertMarkdownAt(pos, content);
    }
  };

  return (
    <NodeViewWrapper
      className="ai-update-node my-2"
      data-ai-update-id={node.attrs.id}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "rounded-lg overflow-hidden shadow-md border-2",
          isAdded && "border-emerald-500/50 bg-emerald-500/5",
          isRemoved && "border-rose-500/50 bg-rose-500/5"
        )}
      >
        {/* Header with badge and actions */}
        <div
          className={cn(
            "flex items-center justify-between px-3 py-1.5",
            isAdded && "bg-emerald-500/10",
            isRemoved && "bg-rose-500/10"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              isAdded && "text-emerald-700 dark:text-emerald-400",
              isRemoved && "text-rose-700 dark:text-rose-400"
            )}
          >
            {isAdded ? (
              <>
                <Plus className="size-3" />
                <span>Addition</span>
              </>
            ) : (
              <>
                <Minus className="size-3" />
                <span>Removal</span>
              </>
            )}
          </div>
          <ButtonGroup>
            <Button
              size="icon-sm"
              variant="ghost"
              className={cn(
                "hover:bg-rose-500/10",
                isAdded && "text-rose-500 hover:text-rose-600",
                isRemoved && "text-emerald-500 hover:text-emerald-600"
              )}
              onClick={handleReject}
              title={isAdded ? "Reject addition" : "Keep content"}
            >
              <X />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className={cn(
                "hover:bg-emerald-500/10",
                isAdded && "text-emerald-500 hover:text-emerald-600",
                isRemoved && "text-rose-500 hover:text-rose-600"
              )}
              onClick={handleAccept}
              title={isAdded ? "Accept addition" : "Confirm removal"}
            >
              <Check />
            </Button>
          </ButtonGroup>
        </div>

        {/* Rendered Markdown Content */}
        <div
          className={cn(
            "m-4",
            isRemoved && "opacity-60 line-through decoration-rose-500/50"
          )}
        >
          <EditorContent editor={updateEditor} />
        </div>
      </motion.div>
    </NodeViewWrapper>
  );
};

// Generate a unique ID for each update node
const generateId = () => Math.random().toString(36).substring(2, 9);

const AIUpdateNode = Node.create({
  name: "aiUpdate",
  group: "block",
  atom: true, // This makes it a single unit that can't be edited directly

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => ({
          "data-id": attributes.id,
        }),
      },
      type: {
        default: "added" as UpdateType,
        parseHTML: (element) =>
          (element.getAttribute("data-type") as UpdateType) || "added",
        renderHTML: (attributes) => ({
          "data-type": attributes.type,
        }),
      },
      content: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-content"),
        renderHTML: (attributes) => ({
          "data-content": attributes.content,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-ai-update]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-ai-update": "" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIUpdateComponent);
  },
});

export { AIUpdateNode, generateId, type UpdateType };
