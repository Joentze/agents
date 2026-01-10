"use client";

import { Button } from "@/components/ui/button";
import { useArtifactAgentSidebar } from "@/hooks/artifact/use-artifact-agent-sidebar";
import { Files, GlobeIcon, Loader2, Pen, Pencil, Plus, X } from "lucide-react";
import { useRef, useState, useCallback, ChangeEvent, useEffect } from "react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputTools,
  PromptInputButton,
  usePromptInputAttachments,
  type PromptInputMessage,
  PromptInputHeader,
  PromptInputHoverCardTrigger,
  PromptInputHoverCard,
  PromptInputHoverCardContent,
} from "@/components/ai-elements/prompt-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaperclipIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { Editor } from "@tiptap/react";

function AgentAttachmentButton({
  isUploading,
  onUploadStart,
  onUploadEnd,
}: {
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadEnd: () => void;
}) {
  const attachments = usePromptInputAttachments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      onUploadStart();
      try {
        await attachments.add(files);
      } finally {
        onUploadEnd();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [attachments, onUploadStart, onUploadEnd]
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="text/csv,application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/html,text/markdown,text/plain"
        className="hidden"
        onChange={handleFileSelect}
      />
      <PromptInputButton
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
      </PromptInputButton>
    </>
  );
}

function AgentSubmitButton({ text }: { text: string }) {
  const attachments = usePromptInputAttachments();
  const hasText = text.trim().length > 0;
  const hasFiles = attachments.files.length > 0;

  return (
    <PromptInputSubmit
      disabled={!hasText && !hasFiles}
      className="border border-muted-foreground ring-1 ring-border/50 ml-auto"
    />
  );
}

function ArtifactFilesSync() {
  const attachments = usePromptInputAttachments();
  const { artifactFiles, clearArtifactFiles } = useArtifactAgentSidebar();
  const syncedUrlsRef = useRef<Set<string>>(new Set());

  // Sync new artifact files to attachments
  useEffect(() => {
    const newFiles = artifactFiles.filter(
      (f) => f.url && !syncedUrlsRef.current.has(f.url)
    );

    if (newFiles.length > 0) {
      attachments.addParts(newFiles);
      newFiles.forEach((f) => {
        if (f.url) syncedUrlsRef.current.add(f.url);
      });
      clearArtifactFiles();
    }
  }, [artifactFiles, attachments, clearArtifactFiles]);

  // Remove from syncedUrls when file is removed from attachments
  useEffect(() => {
    const currentUrls = new Set(
      attachments.files.map((f) => f.url).filter(Boolean)
    );
    // Find urls that were synced but no longer in attachments
    for (const url of syncedUrlsRef.current) {
      if (!currentUrls.has(url)) {
        syncedUrlsRef.current.delete(url);
      }
    }
  }, [attachments.files]);

  return null;
}

export default function ArtifactAgentChatPanel({
  editor,
  ref,
  autoFocus = false,
}: {
  editor: Editor | null;
  ref?: React.RefObject<HTMLTextAreaElement | null>;
  autoFocus?: boolean;
}) {
  const {
    setOpen,
    artifactContents,
    artifactFiles,
    removeLastArtifactContent,
    removeArtifactContent,
  } = useArtifactAgentSidebar();
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = ref || internalRef;
  // add use chat here to chat with artifact agent

  // Auto-focus textarea when panel opens
  useEffect(() => {
    if (autoFocus) {
      // Small delay to ensure DOM is ready after panel animation
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, textareaRef]);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
  }, []);

  const handleSubmit = useCallback((message: PromptInputMessage) => {
    const hasText = message.text?.trim();
    const hasFiles = message.files && message.files.length > 0;

    if (!hasText && !hasFiles) return;

    // TODO: Handle message submission
    console.log("Submit:", message);
    setText("");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Backspace" &&
        text.trim().length === 0 &&
        artifactFiles.length === 0
      ) {
        console.log("Removing last artifact content");
        removeLastArtifactContent();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [text, artifactFiles, removeLastArtifactContent, editor]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-muted/50">
      <div className="flex flex-row p-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-8"
          onClick={() => setOpen(false)}
        >
          <X />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        {/* Messages will go here */}
      </ScrollArea>

      <div className="p-3 shrink-0 ">
        <PromptInput
          className="ring-1 ring-border/50 rounded-md w-full "
          onSubmit={handleSubmit}
          multiple
          accept="text/csv,application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/html,text/markdown,text/plain"
          maxFiles={10}
          maxFileSize={50 * 1024 * 1024}
        >
          {artifactContents.length > 0 && (
            <PromptInputHeader>
              {artifactContents.map(({ content, id }) => (
                <div key={id} className="group relative">
                  <PromptInputHoverCard>
                    <PromptInputHoverCardTrigger>
                      <PromptInputButton size="sm" variant="outline">
                        <Pen className="size-4" />{" "}
                        <span className="truncate w-12">{content}</span>
                      </PromptInputButton>
                    </PromptInputHoverCardTrigger>
                    <PromptInputHoverCardContent className="w-[300px] space-y-4 p-4 text-xs font-mono">
                      {content}
                    </PromptInputHoverCardContent>
                  </PromptInputHoverCard>
                  <Button
                    aria-label="Remove content"
                    className="-right-1.5 -top-1.5 absolute h-5 w-5 rounded-full opacity-0 group-hover:opacity-100"
                    onClick={() => removeArtifactContent(id)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </PromptInputHeader>
          )}
          <PromptInputBody className="">
            <ArtifactFilesSync />
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                handleTextChange(e.target.value)
              }
              ref={textareaRef}
              value={text}
              className="bg-foreground"
              placeholder="Ask about this artifact..."
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <AgentAttachmentButton
                isUploading={isUploading}
                onUploadStart={() => setIsUploading(true)}
                onUploadEnd={() => setIsUploading(false)}
              />
            </PromptInputTools>
            <AgentSubmitButton text={text} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
