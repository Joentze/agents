"use client";

import { Button } from "@/components/ui/button";
import { useArtifactAgentSidebar } from "@/hooks/artifact/use-artifact-agent-sidebar";
import { Loader2, Pen, Plus, X } from "lucide-react";
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
import { Editor } from "@tiptap/react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  generateId,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useChainOfThoughtStore } from "@/hooks/chain-of-thought/use-chain-of-thought";
import {
  ChainOfThoughtRun,
  StepUpdateType,
} from "@/app/types/chain-of-thought";
import ChatConversation from "@/components/ai-elements/chat-conversation";


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

function AgentSubmitButton({
  text,
  status,
}: {
  text: string;
  status: "streaming" | "submitted" | "ready" | "error";
}) {
  const attachments = usePromptInputAttachments();
  const hasText = text.trim().length > 0;
  const hasFiles = attachments.files.length > 0;
  const isSubmitting = status === "streaming" || status === "submitted";

  return (
    <PromptInputSubmit
      disabled={(!hasText && !hasFiles) || isSubmitting}
      status={status}
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
  artifactId,
}: {
  editor: Editor | null;
  ref?: React.RefObject<HTMLTextAreaElement | null>;
  autoFocus?: boolean;
  artifactId: string;
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
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Chat hook for artifact agent
  const artifactChat = useChat({
    id: `artifact-${artifactId}`,
    transport: new DefaultChatTransport({
      api: "/api/artifact/chat",
    }),
    onData: async ({ data, type, id: runId }) => {
      switch (type) {
        case "data-chain-of-thought-run-start":
          const {
            id,
            type: runType,
            startDatetime: runStart,
            status,
            steps,
          } = data as unknown as ChainOfThoughtRun;
          useChainOfThoughtStore.getState().addRun({
            id,
            status,
            type: runType,
            startDatetime: runStart,
            steps,
          });
          break;
        case "data-chain-of-thought-step-update":
          const {
            runId: stepRunId,
            stepId,
            type: stepType,
            status: stepStatus,
            data: stepData,
            startDatetime,
            endDatetime,
          } = data as unknown as StepUpdateType;
          const currentRuns = useChainOfThoughtStore.getState().runs;
          if (
            !Object.keys(currentRuns[stepRunId]?.steps || {}).includes(stepId)
          ) {
            useChainOfThoughtStore.getState().addStep(stepRunId, {
              runId: stepRunId,
              stepId,
              type: stepType,
              status: stepStatus,
              data: stepData,
              startDatetime,
              endDatetime,
            });
          } else {
            useChainOfThoughtStore.getState().updateStep(stepRunId, stepId, {
              runId: stepRunId,
              stepId,
              type: stepType,
              status: stepStatus,
              data: stepData,
              startDatetime,
              endDatetime,
            });
          }
          break;
        case "data-chain-of-thought-run-end":
          const { id: currentRunId, status: runStatus } =
            data as unknown as ChainOfThoughtRun;
          useChainOfThoughtStore.getState().updateRun(currentRunId, {
            status: runStatus,
          });
          break;
        case "data-artifact-agent-generate-markdown-block-end":
          const { markdown, index } = data as unknown as { markdown: string, index: number };

          // parse markdown as node and then insert the node instead
          const editor = editorRef.current;
          if (editor) {
            // Create an AI update node with the markdown content
            const aiUpdateNode = {
              type: "aiUpdate",
              attrs: {
                id: runId,
                type: "added",
                content: markdown,
              },
            };

            // Get current nodes to calculate position
            const currentNodes = editor.getJSON()?.content || [];

            // Calculate position: sum of all node sizes before the target index
            let position = 0;
            for (let i = 0; i < Math.min(index, currentNodes.length); i++) {
              position += editor.state.doc.content.child(i).nodeSize;
            }

            // Insert the AI update node at the calculated position
            editor
              .chain()
              .focus()
              .insertContentAt(position, aiUpdateNode)
              .run();
          }
          break;
        case "data-artifact-agent-update-markdown-node-in-artifact-end":
          const { markdown: newMarkdown, index: nodeIndex } = data as unknown as { markdown: string, index: number };

          const updateEditor = editorRef.current;
          if (updateEditor) {
            // Get current nodes
            const nodes = updateEditor.getJSON()?.content || [];

            if (nodeIndex >= 0 && nodeIndex < nodes.length) {
              // Get the original node's markdown for the "removed" display
              const originalNode = nodes[nodeIndex];
              const originalMarkdown = updateEditor.markdown?.serialize(originalNode) || "";

              // Calculate position: sum of all node sizes before the target index
              let updatePosition = 0;
              for (let i = 0; i < nodeIndex; i++) {
                updatePosition += updateEditor.state.doc.content.child(i).nodeSize;
              }

              // Get the size of the node to be deleted
              const nodeSize = updateEditor.state.doc.content.child(nodeIndex).nodeSize;

              // Create AI update node for removed content
              const aiUpdateRemovedNode = {
                type: "aiUpdate",
                attrs: {
                  id: runId,
                  type: "removed",
                  content: originalMarkdown,
                },
              };

              // Create AI update node for added content
              const aiUpdateAddedNode = {
                type: "aiUpdate",
                attrs: {
                  id: runId,
                  type: "added",
                  content: newMarkdown,
                },
              };

              // Delete the original node and insert the AI update nodes
              updateEditor
                .chain()
                .focus()
                .deleteRange({ from: updatePosition, to: updatePosition + nodeSize })
                .insertContentAt(updatePosition, [aiUpdateRemovedNode, aiUpdateAddedNode])
                .run();
            }
          }
          break;
        default:
          break;
      }
    },
    async onToolCall({ toolCall }) {
      // Handle readArtifact - a dynamic tool that we execute automatically
      if (toolCall.toolName === "readArtifact") {
        const currentNodes = editorRef.current?.getJSON()?.content || [];
        console.log("currentNodes", currentNodes);
        currentNodes.map((node, index) => {
          return { markdown: editorRef.current?.markdown?.serialize(node).slice(0, 50), index };
        });
        // No await - avoids potential deadlocks

        addToolOutput({
          tool: "readArtifact",
          toolCallId: toolCall.toolCallId,
          output: currentNodes,
        });
      }
      else if (toolCall.toolName === "readNodeInArtifact") {
        const { index } = toolCall.input as { index: number };
        const node = editorRef.current?.getJSON()?.content?.[index];
        const markdown = node ? editorRef.current?.markdown?.serialize(node) : undefined;
        addToolOutput({
          tool: "readNodeInArtifact",
          toolCallId: toolCall.toolCallId,
          output: {
            markdown,
            index,
          },
        });
      }
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });
  const { messages, status, sendMessage, addToolOutput } = artifactChat;

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

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const hasText = message.text?.trim();
      const hasFiles = message.files && message.files.length > 0;

      if (!hasText && !hasFiles) return;

      // Build content parts for the message
      const content = message.text || "Sent with attachments";
      // Get fresh contents directly from store to avoid stale closure
      const freshContents = useArtifactAgentSidebar.getState().artifactContents;
      // Get all nodes from the editor as JSON

      sendMessage(
        {
          text: content,
          files: message.files,
          metadata: {
            selectedContents: freshContents,
          },
        },
        {
          body: {

          },
        }
      );

      setText("");
      useArtifactAgentSidebar.getState().clearArtifactContents();
    },
    [sendMessage, artifactId, editor]
  );

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

      <ChatConversation
        messages={messages}
        status={status}
        size="sm"
        className="flex-1 px-3"
      />

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
            <AgentSubmitButton text={text} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
