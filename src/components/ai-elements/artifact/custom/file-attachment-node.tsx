"use client";
import {
  NodeViewWrapper,
  ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { Node, createBlockMarkdownSpec, mergeAttributes } from "@tiptap/core";
import { useCallback } from "react";
import { FileText, FileSpreadsheet, Presentation, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileViewer } from "@/hooks/artifact/use-file-viewer";

/**
 * Get the appropriate icon for a file based on its original MIME type
 */
function getFileIcon(mimeType: string) {
  // Word documents
  if (
    mimeType === "application/msword" ||
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return FileText;
  }

  // Excel spreadsheets
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "text/csv" ||
    mimeType === "application/csv"
  ) {
    return FileSpreadsheet;
  }

  // PowerPoint presentations
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return Presentation;
  }

  // PDF
  if (mimeType === "application/pdf") {
    return FileText;
  }

  // Default
  return File;
}

/**
 * Get a human-readable file type label
 */
function getFileTypeLabel(mimeType: string): string {
  if (
    mimeType === "application/msword" ||
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "Word Document";
  }

  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "Excel Spreadsheet";
  }

  if (mimeType === "text/csv" || mimeType === "application/csv") {
    return "CSV File";
  }

  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "PowerPoint Presentation";
  }

  if (mimeType === "application/pdf") {
    return "PDF Document";
  }

  return "Document";
}

const FileAttachmentComponent = ({ node, selected }: ReactNodeViewProps) => {
  const { url, filename, originalMimeType } = node.attrs as {
    url: string;
    filename: string;
    originalMimeType: string;
  };
  const { openFile, fileUrl } = useFileViewer();

  const IconComponent = getFileIcon(originalMimeType);
  const fileTypeLabel = getFileTypeLabel(originalMimeType);
  const isActive = fileUrl === url;

  const handleClick = useCallback(() => {
    openFile(url, filename);
  }, [url, filename, openFile]);

  return (
    <NodeViewWrapper className="file-attachment-node my-2">
      <div
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-3 px-4 py-3 rounded-lg",
          "border border-border bg-muted/30 hover:bg-muted/50",
          "cursor-pointer transition-colors duration-200",
          "max-w-md",
          (isActive || selected) && "ring-2 ring-primary/50 bg-primary/5",
        )}
      >
        <div
          className={cn(
            "flex-shrink-0 p-2 rounded-md bg-primary/10",
            isActive && "bg-primary/20"
          )}
        >
          <IconComponent className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">{filename}</span>
          <span className="text-xs text-muted-foreground">{fileTypeLabel}</span>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

const FileAttachmentNode = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
      filename: {
        default: "document",
      },
      originalMimeType: {
        default: "application/pdf",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-file-attachment]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-file-attachment": "" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentComponent);
  },
  markdownTokenName: "fileAttachment",

  ...createBlockMarkdownSpec({
    allowedAttributes: ["url", "filename", "originalMimeType"],
    nodeName: "fileAttachment",
    name: "fileAttachment",
    content: "block",
  }),
});

export { FileAttachmentNode };
