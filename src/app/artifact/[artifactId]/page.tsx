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
import { EditorContent } from "@tiptap/react";
import { useEffect, useState } from "react";
import { PDFViewer } from "@/components/ui/pdf-viewer";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, Share } from "lucide-react";

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

export default function ArtifactPage({
  params,
}: {
  params: Promise<{ artifactId: string }>;
}) {
  const { id, content, title, public: isArtifactPublic } = useArtifactData();
  const editor = getEditor(content);
  const { open, setOpen } = useSidebar();
  const isMobile = useIsMobile();
  // here for testing only
  const [fileOpen, setFileOpen] = useState(true);
  const [isPublic, setIsPublic] = useState<boolean>(isArtifactPublic);

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
    }
  }, [editor, content]);

  const showTrigger = !open || isMobile;

  return (
    <Dialog>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
        <div className="h-14 p-2 flex flex-row absolute top-0 left-0 w-full z-3 bg-gradient-to-b from-background to-transparent">
          {showTrigger && (
            <SidebarTrigger
              className="my-auto"
              onClick={() => setOpen(!open)}
            />
          )}

          <DialogTrigger asChild>
            <Button variant={"ghost"} className="ml-auto">
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
                    await updateArtifactPublicity({ isPublic: checked });
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
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel
            defaultSize={fileOpen ? 50 : 100}
            minSize={25}
            className="h-full"
          >
            <div className="h-full w-full overflow-y-auto">
              <div className={cn("pb-24", showTrigger ? "pt-12" : "pt-4")}>
                <div
                  className={cn(
                    "md:mx-24 lg:mx-56 mx-6 border-b border-border flex flex-col gap-2 pb-10 mt-8",
                    fileOpen && "md:mx-6 lg:mx-6 mx-6"
                  )}
                >
                  <div
                    contentEditable
                    className="md:text-3xl text-2xl font-bold line-clamp-1 focus:outline-none"
                  >
                    {title}
                  </div>
                </div>
                <EditorContent
                  editor={editor}
                  className={cn(
                    "md:px-24 lg:px-56 px-6",
                    fileOpen && "md:px-6 lg:px-6 px-6"
                  )}
                />
              </div>
            </div>
          </ResizablePanel>
          {fileOpen && (
            <ResizableHandle withHandle className="bg-transparent" />
          )}
          {fileOpen && (
            <ResizablePanel
              defaultSize={50}
              minSize={25}
              className="h-full p-4 pt-14"
            >
              <PDFViewer
                onClose={() => setFileOpen(false)}
                fileUrl={
                  "https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf"
                }
                fileName={"test.pdf"}
              />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </Dialog>
  );
}
