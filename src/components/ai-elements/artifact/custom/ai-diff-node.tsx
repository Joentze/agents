"use client";

import {
  NodeViewWrapper,
  ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo } from "react";
import { marked } from "marked";
import { ButtonGroup } from "@/components/ui/button-group";

interface DiffSegment {
  type: "added" | "removed" | "unchanged";
  value: string;
}

interface AIDiffNodeAttrs {
  originalContent: string;
  newContent: string;
  diffs: DiffSegment[];
}

const AIDiffComponent = ({ node, editor, getPos }: ReactNodeViewProps) => {
  const attrs = node.attrs as AIDiffNodeAttrs;
  const { originalContent, newContent, diffs } = attrs;
  const [showDiff, setShowDiff] = useState(false);

  // Parse markdown to HTML for preview
  const renderedMarkdown = useMemo(() => {
    return marked.parse(newContent, { async: false }) as string;
  }, [newContent]);

  // Helper to insert markdown content at a position
  const insertMarkdownAt = (pos: number, markdown: string) => {
    // Parse markdown to TipTap JSON document using the markdown extension
    const parsedDoc = editor.markdown?.parse(markdown);

    if (parsedDoc && parsedDoc.content) {
      // Insert the parsed content (extract content from the doc wrapper)
      editor
        .chain()
        .focus()
        .insertContentAt(pos, parsedDoc.content, {
          updateSelection: true,
        })
        .run();
    } else {
      // Fallback: insert as plain text if markdown parsing fails
      editor.chain().focus().insertContentAt(pos, markdown).run();
    }
  };

  const handleApprove = () => {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos === undefined) return;

    // Delete this node first
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .run();

    // Then insert the new markdown content at that position
    insertMarkdownAt(pos, newContent);
  };

  const handleReject = () => {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos === undefined) return;

    // Delete this node first
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .run();

    // Then insert the original markdown content at that position
    insertMarkdownAt(pos, originalContent);
  };

  return (
    <NodeViewWrapper
      className="ai-diff-node my-2"
      data-ai-diff-id={node.attrs.id}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-2 border-indigo-500/50 rounded-lg overflow-hidden "
      >
        {/* Rendered Markdown Content */}
        <div
          className="p-3 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
        />

        {/* Collapsible Diff View */}
        <AnimatePresence>
          {showDiff && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-indigo-500/30 bg-accent/30">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/50">
                  Changes
                </div>
                <div className="p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {diffs.map((diff, index) => {
                    if (diff.type === "added") {
                      return (
                        <span
                          key={index}
                          className="bg-green-500/20 text-green-700 dark:text-green-400 rounded px-0.5"
                        >
                          {diff.value}
                        </span>
                      );
                    } else if (diff.type === "removed") {
                      return (
                        <span
                          key={index}
                          className="bg-red-500/20 text-red-700 dark:text-red-400 line-through rounded px-0.5"
                        >
                          {diff.value}
                        </span>
                      );
                    } else {
                      return <span key={index}>{diff.value}</span>;
                    }
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? (
                <>
                  <ChevronUp className="size-3 mr-0.5" />
                  Hide diff
                </>
              ) : (
                <>
                  <ChevronDown className="size-3 mr-0.5" />
                  Show diff
                </>
              )}
            </Button>
          </div>
          <ButtonGroup>
            <Button
              size="icon-sm"
              variant="ghost"
              className=""
              onClick={handleApprove}
              title="Accept changes"
            >
              <Check className="text-green-500" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className=""
              onClick={handleReject}
              title="Reject changes"
            >
              <X className="text-red-500" />
            </Button>
          </ButtonGroup>
        </div>
      </motion.div>
    </NodeViewWrapper>
  );
};

// Generate a unique ID for each diff node
const generateId = () => Math.random().toString(36).substring(2, 9);

const AIDiffNode = Node.create({
  name: "aiDiff",
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
      originalContent: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-original"),
        renderHTML: (attributes) => ({
          "data-original": attributes.originalContent,
        }),
      },
      newContent: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-new"),
        renderHTML: (attributes) => ({
          "data-new": attributes.newContent,
        }),
      },
      diffs: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute("data-diffs");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => ({
          "data-diffs": JSON.stringify(attributes.diffs),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-ai-diff]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-ai-diff": "" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIDiffComponent);
  },
});

export { AIDiffNode, generateId, type DiffSegment };
