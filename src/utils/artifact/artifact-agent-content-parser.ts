import { Editor, Range } from "@tiptap/core";
import { FileUIPart } from "ai";
import { JSONContent } from "@tiptap/react";
import { createHash } from "crypto";

interface ParsedNode {
  pos: number;
  nodeIndex: number;
  type: string;
}

interface ArtifactAgentParsedContent {
  id: string;
  text: string;
  files: FileUIPart[];
  selectedNodes: ParsedNode[];
}

/**
 * Get image MIME type from URL extension
 */
function getImageMimeType(url: string): string {
  const extension = url.split(".").pop()?.toLowerCase().split("?")[0];
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
  };
  return mimeTypes[extension || ""] || "image/png";
}

/**
 * Extract text content from a cell node
 */
function extractCellText(node: JSONContent): string {
  const parts: string[] = [];
  if (node.type === "text" && node.text) {
    parts.push(node.text);
  }
  if (node.content && Array.isArray(node.content)) {
    node.content.forEach((child) => {
      parts.push(extractCellText(child));
    });
  }
  return parts.join("");
}

/**
 * Parse a table node into markdown format
 */
function parseTableToMarkdown(node: JSONContent): string {
  if (!node.content || !Array.isArray(node.content)) return "";

  const rows: string[][] = [];
  let hasHeader = false;

  node.content.forEach((row) => {
    if (row.type === "tableRow" && row.content) {
      const cells: string[] = [];
      row.content.forEach((cell) => {
        if (cell.type === "tableHeader") {
          hasHeader = true;
        }
        cells.push(extractCellText(cell).trim());
      });
      rows.push(cells);
    }
  });

  if (rows.length === 0) return "";

  // Build markdown table
  const lines: string[] = [];
  rows.forEach((row, rowIndex) => {
    lines.push(`| ${row.join(" | ")} |`);
    // Add separator after header row
    if (rowIndex === 0 && hasHeader) {
      lines.push(`| ${row.map(() => "---").join(" | ")} |`);
    }
  });

  return lines.join("\n");
}

/**
 * Recursively parse through editor content to extract text and files
 */
function parseContentNode(
  node: JSONContent,
  textParts: string[],
  files: FileUIPart[]
): void {
  // Handle file attachment nodes (all office docs are converted to PDF)
  if (node.type === "fileAttachment" && node.attrs) {
    const { url, filename, originalMimeType } = node.attrs as {
      url: string;
      filename: string;
      originalMimeType: string;
    };
    if (url) {
      files.push({
        type: "file",
        url,
        filename: filename || "document.pdf",
        mediaType: "application/pdf", // All docs are converted to PDF
      });
    }
  }

  // Handle image nodes
  if (node.type === "image" && node.attrs) {
    const { src, alt } = node.attrs as { src: string; alt?: string };
    if (src) {
      files.push({
        type: "file",
        url: src,
        filename: alt || "image",
        mediaType: getImageMimeType(src),
      });
    }
  }

  // Handle table nodes - convert to markdown
  if (node.type === "table") {
    const tableMarkdown = parseTableToMarkdown(node);
    if (tableMarkdown) {
      textParts.push(tableMarkdown);
    }
    return; // Don't recurse into table children, we've handled them
  }

  // Handle text nodes
  if (node.type === "text" && node.text) {
    textParts.push(node.text);
  }

  // Handle hard breaks as newlines
  if (node.type === "hardBreak") {
    textParts.push("\n");
  }

  // Recursively process child content
  if (node.content && Array.isArray(node.content)) {
    node.content.forEach((child, index) => {
      parseContentNode(child, textParts, files);

      // Add newlines between block-level elements
      if (
        index < node.content!.length - 1 &&
        ["paragraph", "heading", "blockquote", "codeBlock", "table"].includes(
          child.type || ""
        )
      ) {
        textParts.push("\n\n");
      }
    });
  }
}

function parseArtifactAgentContent(editor: Editor): ArtifactAgentParsedContent {
  const textParts: string[] = [];
  const files: FileUIPart[] = [];
  const nodes: ParsedNode[] = [];
  const { from, to } = editor.state.selection;
  const pos: number | Range = editor.state.selection.anchor;

  // Collect node positions from the selection range
  editor.state.doc.nodesBetween(from, to, (node, nodePos, parent, index) => {
    // Only track top-level nodes (direct children of doc or within selection)
    if (parent === editor.state.doc) {
      nodes.push({
        pos: nodePos,
        nodeIndex: index,
        type: node.type.name,
      });
    }
    return true; // Continue traversing
  });

  // Parse content for text and files
  const content = editor.state.selection.content().toJSON();
  if (content && content.content) {
    content.content.forEach((node: JSONContent, index: number) => {
      parseContentNode(node, textParts, files);

      // Add newlines between top-level blocks
      if (index < content.content.length - 1) {
        textParts.push("\n\n");
      }
    });
  }

  const text = textParts.join("").trim();
  const id = createHash("sha256").update(text).digest("hex").slice(0, 12);
  return { text, files, id, selectedNodes: nodes };
}

export { parseArtifactAgentContent };
export type { ArtifactAgentParsedContent, ParsedNode };
