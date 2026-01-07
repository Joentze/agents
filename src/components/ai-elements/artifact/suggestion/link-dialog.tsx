"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLinkDialogStore } from "@/stores/use-link-dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const defaultLinks = [
  { label: "Google", url: "https://google.com" },
  { label: "GitHub", url: "https://github.com" },
  { label: "YouTube", url: "https://youtube.com" },
  { label: "Wikipedia", url: "https://wikipedia.org" },
  { label: "Stack Overflow", url: "https://stackoverflow.com" },
];

export function LinkDialog() {
  const { open, editor, defaultText, defaultUrl, closeDialog } =
    useLinkDialogStore();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  // Initialize with default values when dialog opens
  useEffect(() => {
    if (open) {
      setText(defaultText);
      setUrl(defaultUrl);
    }
  }, [open, defaultText, defaultUrl]);

  const handleInsert = () => {
    if (editor && url && text) {
      // Insert text and set it as a link
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: text,
          marks: [
            {
              type: "link",
              attrs: {
                href: url,
                target: "_blank",
              },
            },
          ],
        })
        .run();
      setText("");
      setUrl("");
      closeDialog();
    }
  };

  const handleDefaultLinkClick = (defaultUrl: string, label: string) => {
    setUrl(defaultUrl);
    if (!text) {
      setText(label);
    }
  };

  const handleClose = () => {
    setText("");
    setUrl("");
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="link-text">Text</Label>
            <Input
              id="link-text"
              placeholder="Link text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && text && url) {
                  handleInsert();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleInsert} disabled={!url || !text}>
            Add Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
