"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useYouTubeDialogStore } from "@/stores/use-youtube-dialog";
import { Plus } from "lucide-react";

export function YouTubeDialog() {
  const { open, editor, range, closeDialog } = useYouTubeDialogStore();
  const [url, setUrl] = useState("");

  useEffect(() => {
    console.log("youtube dialog open", open);
  }, [open]);
  const handleInsert = () => {
    if (editor && url) {
      // Range is already deleted by the command before opening dialog
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
      setUrl("");
      closeDialog();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert YouTube Video</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleInsert();
            }
          }}
        />
        <DialogFooter>
          <Button onClick={handleInsert} disabled={!url}>
            Add Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
