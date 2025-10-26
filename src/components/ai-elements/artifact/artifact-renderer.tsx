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
import { EditorContent, useEditor } from "@tiptap/react";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { Share, X } from "lucide-react";
import { useArtifactStore } from "@/hooks/artifact/use-artifact";

import { useEffect } from "react";
import { CustomReactNode } from "@/components/ai-elements/artifact/custom/custom-react-node";
import { Callout } from "./custom/callout-node";

interface ArtifactRendererProps {
  artifactId: string;
  defaultContent?: string;
}

export function ArtifactRenderer({
  artifactId,
  defaultContent,
}: ArtifactRendererProps) {
  const { artifacts, clearCurrentArtifact } = useArtifactStore();
  const artifact = artifacts[artifactId];
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [Markdown, TableKit, StarterKit, Callout],
    contentType: "markdown",
    content: defaultContent || "",
  });
  if (!artifact) {
    return null;
  }

  useEffect(() => {
    editor?.commands.setContent(artifact.content, {
      emitUpdate: false,
      contentType: "markdown",
    });
  }, [artifact]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="w-full flex flex-col"
    >
      <Artifact className="m-4 flex-1">
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
              onClick={clearCurrentArtifact}
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
