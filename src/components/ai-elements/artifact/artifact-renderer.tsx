"use client";
import { motion } from "motion/react";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "../artifact";
import { Image } from "@tiptap/extension-image";
import { Mathematics } from "@tiptap/extension-mathematics";
import { EditorContent, useEditor } from "@tiptap/react";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Highlight from "@tiptap/extension-highlight";
import { Share, X } from "lucide-react";
import { useArtifactStore } from "@/hooks/artifact/use-artifact";
import { Gapcursor } from "@tiptap/extensions";

import { useEffect } from "react";
import { FlashCardNode } from "./custom/flash-card-node";
import Commands from "./suggestion/artifact-suggestion-command";
import { Placeholder } from "@tiptap/extensions";
import { MCQNode } from "./custom/mcq-node";
import { OpenEndedNode } from "./custom/open-ended-node";
import { AIDiffNode } from "./custom/ai-diff-node";
import { FileAttachmentNode } from "./custom/file-attachment-node";
import { FileHandlerExtension } from "@/utils/artifact/file-handler";

interface ArtifactRendererProps {
  artifactId: string;
  defaultContent?: string;
}

export const getEditor = (defaultContent?: string) =>
  useEditor({
    immediatelyRender: false,
    extensions: [
      Markdown,
      TableKit.configure({
        table: { resizable: true },
      }),
      FileHandlerExtension,
      StarterKit,
      FlashCardNode,
      MCQNode,
      Image,
      Mathematics,
      Gapcursor,
      Commands,
      OpenEndedNode,
      AIDiffNode,
      FileAttachmentNode,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands",
      }),
    ],
    contentType: "markdown",
    content: defaultContent || "",
  });
export function ArtifactRenderer({
  artifactId,
  defaultContent,
}: ArtifactRendererProps) {
  // Subscribe only to the specific artifact we need
  const artifact = useArtifactStore((state) => state.artifacts[artifactId]);
  const editor = getEditor(defaultContent);
  useEffect(() => {
    if (artifact && editor) {
      editor.commands.setContent(artifact.content, {
        emitUpdate: false,
        contentType: "markdown",
      });
    }
  }, [artifact, editor]);

  if (!artifact) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col max-h-screen"
    >
      <Artifact className="my-4 ml-0 mr-4 h-screen">
        <ArtifactHeader>
          <div>
            <ArtifactTitle>{artifact.title}</ArtifactTitle>
            <ArtifactDescription className="text-sm line-clamp-1">
              {artifact.description}
            </ArtifactDescription>
          </div>
          <ArtifactActions>
            <ArtifactAction
              icon={Share}
              label="Share"
              tooltip="Share artifact"
            />
            <ArtifactAction
              icon={X}
              label="Close"
              onClick={() => useArtifactStore.getState().clearCurrentArtifact()}
            />
          </ArtifactActions>
        </ArtifactHeader>
        <ArtifactContent className="">
          <EditorContent editor={editor} />
        </ArtifactContent>
      </Artifact>
    </motion.div>
  );
}
