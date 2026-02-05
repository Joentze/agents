"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useArtifactData } from "./artifact-provider";
import { getEditor } from "@/components/ai-elements/artifact/artifact-renderer";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Editor, EditorContent, JSONContent } from "@tiptap/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { PDFViewer } from "@/components/ui/pdf-viewer";
import { cn } from "@/lib/utils";
import { useFileViewer } from "@/hooks/artifact/use-file-viewer";

import { Button } from "@/components/ui/button";
import { GripVertical, Link, Share } from "lucide-react";
import DragHandle from "@tiptap/extension-drag-handle-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/utils/supabase/client";
import { updateArtifact } from "@/app/actions/artifact-actions";
import { ArtifactBubbleMenu } from "@/components/ai-elements/artifact/menu/artifact-bubble-menu";
import { Json } from "@/app/types/database.types";
import { YouTubeDialog } from "@/components/ai-elements/artifact/suggestion/youtube-dialog";
import { LinkDialog } from "@/components/ai-elements/artifact/suggestion/link-dialog";
import { FilePicker } from "@/components/ai-elements/artifact/suggestion/file-picker";
import { useArtifactAgentSidebar } from "@/hooks/artifact/use-artifact-agent-sidebar";
import ArtifactAgentChatPanel from "@/components/ai-elements/artifact/agent/artifact-agent-chat-panel";
import { parseArtifactAgentContent } from "@/utils/artifact/artifact-agent-content-parser";
import { PromptInputTextarea } from "@/components/ai-elements/prompt-input";

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

export default function ArtifactPage({
  params,
}: {
  params: Promise<{ artifactId: string }>;
}) {
  const {
    id,
    content,
    title,
    public: isArtifactPublic,
    jsonContent,
  } = useArtifactData();
  const editor = getEditor(
    content,
    jsonContent as unknown as JSONContent | null
  );
  const { open, setOpen } = useSidebar();
  const {
    open: agentSidebarOpen,
    setOpen: setAgentSidebarOpen,
    addArtifactFile,
    addArtifactContent,
  } = useArtifactAgentSidebar();
  const isMobile = useIsMobile();
  const {
    isOpen: fileOpen,
    fileUrl,
    fileName,
    closeFile,
    isRight,
  } = useFileViewer();
  const [isPublic, setIsPublic] = useState<boolean>(isArtifactPublic);
  const [lastEdited, setLastEdited] = useState<Date | null>(null);
  const [timeAgoText, setTimeAgoText] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const agentChatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback(
    async (updates: {
      title?: string;
      content?: string;
      jsonContent?: Record<string, unknown>;
    }) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          await updateArtifact(id, {
            ...updates,
            jsonContent: updates.jsonContent as Json,
          });
          setLastEdited(new Date());
        } catch (error) {
          console.error("Failed to save:", error);
        } finally {
          setIsSaving(false);
        }
      }, 1000); // 1 second debounce
    },
    [id]
  );

  const handleTitleChange = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const newTitle = e.currentTarget.textContent || "";
      debouncedSave({ title: newTitle });
    },
    [debouncedSave]
  );

  const handleContentChange = useCallback(
    ({ editor }: { editor: Editor }) => {
      const markdown = editor.getMarkdown();
      debouncedSave({ content: markdown, jsonContent: editor.getJSON() });
    },
    [debouncedSave]
  );

  async function updateArtifactPublicity({ isPublic }: { isPublic: boolean }) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("artifact")
      .update({ public: isPublic })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error(error);
      throw new Error(error.message);
    }
    setIsPublic(isPublic);
    return data;
  }

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content, {
        emitUpdate: false,
        contentType: "markdown",
      });

      // Set up content change listener
      editor.on("update", handleContentChange);

      return () => {
        editor.off("update", handleContentChange);
      };
    }
  }, [editor, content, handleContentChange]);

  // Update time ago text every 10 seconds
  useEffect(() => {
    if (!lastEdited) return;

    const updateTimeAgo = () => {
      setTimeAgoText(formatTimeAgo(lastEdited));
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastEdited]);

  // Keyboard shortcut: Cmd/Ctrl + J to toggle agent sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && agentSidebarOpen) {
        e.preventDefault();
        setAgentSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();

        // get the current selected content
        // parse for files and text, add to state manager for chat input pills
        if (editor) {
          const { text, files, id } = parseArtifactAgentContent(editor);
          files.forEach((file) => addArtifactFile(file));
          if (text.trim().length > 0) {
            addArtifactContent(text, id);
          }
        }
        setAgentSidebarOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    agentSidebarOpen,
    setAgentSidebarOpen,
    editor,
    addArtifactFile,
    addArtifactContent,
  ]);

  const showTrigger = !open || isMobile;

  return (
    <>
      <YouTubeDialog />
      <LinkDialog />
      <FilePicker />
      <Dialog>
        <div className="h-screen w-full max-w-full flex flex-col overflow-hidden bg-background">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full overflow-hidden"
          >
            <ResizablePanel
              defaultSize={agentSidebarOpen ? 80 : 100}
              minSize={50}
              className="h-full min-w-0 relative"
            >
              <div className="h-14 p-2 flex flex-row absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background to-transparent">
                {showTrigger && (
                  <SidebarTrigger
                    className="my-auto"
                    onClick={() => setOpen(!open)}
                  />
                )}
                <div className="flex flex-row gap-2 ml-auto">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isSaving && (
                      <p className="text-sm text-muted-foreground animate-pulse">
                        Saving...
                      </p>
                    )}
                    {!isSaving && lastEdited && (
                      <p className="text-sm text-muted-foreground">
                        Edited {timeAgoText}
                      </p>
                    )}
                  </div>
                  <DialogTrigger asChild>
                    <Button variant={"ghost"} className="">
                      <Share />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Artifact</DialogTitle>
                      <DialogDescription>
                        Make artifact public to share with others
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-md w-full bg-accent/50 border border-border p-4">
                      <div className="flex items-center space-x-2 ">
                        <Label htmlFor="public-artifact">
                          Make artifact {isPublic ? "private" : "public"}?
                        </Label>
                        <Switch
                          id="public-artifact"
                          className="ml-auto"
                          checked={isPublic}
                          onCheckedChange={async (checked) => {
                            await updateArtifactPublicity({
                              isPublic: checked,
                            });
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        disabled={!isPublic}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/artifact/${id}`
                          );
                        }}
                      >
                        <Link />
                        Copy Link
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </div>
              </div>
              <ResizablePanelGroup
                key={isRight ? "pdf-right" : "pdf-left"}
                direction="horizontal"
                className="h-full w-full overflow-hidden"
              >
                {/* PDF Viewer on the left when isRight is false */}
                {!isRight && fileOpen && fileUrl && fileName && (
                  <ResizablePanel
                    defaultSize={50}
                    minSize={25}
                    className="h-full min-w-0 p-4 pt-14 overflow-hidden"
                  >
                    <PDFViewer
                      isRight={isRight}
                      onSwap={() =>
                        useFileViewer.setState({ isRight: !isRight })
                      }
                      onClose={closeFile}
                      fileUrl={fileUrl}
                      fileName={fileName}
                    />
                  </ResizablePanel>
                )}
                {!isRight && fileOpen && fileUrl && fileName && (
                  <ResizableHandle withHandle className="bg-transparent" />
                )}

                {/* Editor Panel */}
                <ResizablePanel
                  defaultSize={fileOpen ? 50 : 100}
                  minSize={25}
                  className="h-full min-w-0"
                >
                  <div className="h-full w-full max-w-full overflow-y-auto overflow-x-hidden">
                    <div
                      className={cn(
                        "pb-24 max-w-full",
                        showTrigger ? "pt-12" : "pt-4"
                      )}
                    >
                      <div
                        className={cn(
                          "md:mx-24 lg:mx-56 mx-6 border-b border-border flex flex-col gap-2 pb-10 mt-8 max-w-full",
                          fileOpen && "md:mx-6 lg:mx-6 mx-6"
                        )}
                      >
                        <div
                          ref={titleRef}
                          contentEditable
                          suppressContentEditableWarning
                          onInput={handleTitleChange}
                          className="md:text-3xl text-2xl font-bold line-clamp-1 focus:outline-none"
                        >
                          {title}
                        </div>
                      </div>
                      {editor && (
                        <ArtifactBubbleMenu editor={editor as Editor} />
                      )}
                      <DragHandle editor={editor as Editor}>
                        <Button
                          variant={"ghost"}
                          size={"icon"}
                          className="mr-8 w-5 "
                        >
                          <GripVertical />
                        </Button>
                      </DragHandle>
                      <EditorContent
                        editor={editor}
                        className={cn(
                          "md:px-24 lg:px-56 px-6 max-w-full",
                          fileOpen && "md:px-6 lg:px-6 px-6"
                        )}
                      />
                    </div>
                  </div>
                </ResizablePanel>

                {/* PDF Viewer on the right when isRight is true */}
                {isRight && fileOpen && fileUrl && fileName && (
                  <ResizableHandle withHandle className="bg-transparent" />
                )}
                {isRight && fileOpen && fileUrl && fileName && (
                  <ResizablePanel
                    defaultSize={50}
                    minSize={25}
                    className="h-full min-w-0 p-4 pt-14 overflow-hidden"
                  >
                    <PDFViewer
                      isRight={isRight}
                      onSwap={() =>
                        useFileViewer.setState({ isRight: !isRight })
                      }
                      onClose={closeFile}
                      fileUrl={fileUrl}
                      fileName={fileName}
                    />
                  </ResizablePanel>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {/* Agent Sidebar Panel */}
            {agentSidebarOpen && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  defaultSize={20}
                  minSize={15}
                  maxSize={40}
                  className="h-full min-w-0"
                >
                  <div className="h-screen w-full overflow-y-auto">
                    <ArtifactAgentChatPanel
                      ref={agentChatInputRef}
                      autoFocus
                      editor={editor as Editor}
                      artifactId={id}
                    />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </Dialog>
    </>
  );
}
