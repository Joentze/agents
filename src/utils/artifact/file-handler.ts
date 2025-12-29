import { FileHandler } from "@tiptap/extension-file-handler";
import type { Editor } from "@tiptap/core";

// Allowed MIME types for the file handler
const allowedMimeTypes = [
  // Images
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  // PDFs
  "application/pdf",
  // Office documents - Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Office documents - Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Office documents - PowerPoint
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // CSV
  "text/csv",
  "application/csv",
];

const imageMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

/**
 * Check if a MIME type is an image
 */
function isImageMimeType(mimeType: string): boolean {
  return imageMimeTypes.includes(mimeType);
}

/**
 * Upload a file to the /api/file endpoint
 */
async function uploadFile(
  file: File
): Promise<{ url: string; originalFilename: string; fileType: string } | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/file", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("File upload failed:", error);
      return null;
    }

    const data = await response.json();
    return {
      url: data.url,
      originalFilename: data.originalFilename,
      fileType: data.fileType,
    };
  } catch (error) {
    console.error("File upload error:", error);
    return null;
  }
}

/**
 * Insert content into the editor based on file type
 */
function insertFileContent(
  editor: Editor,
  url: string,
  filename: string,
  fileType: string,
  originalMimeType: string,
  pos: number
) {
  if (fileType === "image") {
    // Insert as image
    editor
      .chain()
      .insertContentAt(pos, {
        type: "image",
        attrs: {
          src: url,
          alt: filename,
        },
      })
      .focus()
      .run();
  } else {
    // Insert as file attachment node for documents (PDF, office docs, etc.)
    editor
      .chain()
      .insertContentAt(pos, {
        type: "fileAttachment",
        attrs: {
          url,
          filename,
          originalMimeType,
        },
      })
      .focus()
      .run();
  }
}

/**
 * Handle file upload and insertion
 */
async function handleFiles(editor: Editor, files: File[], pos: number) {
  for (const file of files) {
    // Validate MIME type
    if (!allowedMimeTypes.includes(file.type)) {
      console.warn(`File type not allowed: ${file.type}`);
      continue;
    }

    // Upload the file
    const result = await uploadFile(file);

    if (result) {
      // Determine file type for insertion
      const insertType = isImageMimeType(file.type) ? "image" : "document";
      insertFileContent(
        editor,
        result.url,
        result.originalFilename,
        insertType,
        file.type,
        pos
      );
    }
  }
}

const FileHandlerExtension = FileHandler.configure({
  allowedMimeTypes,
  onDrop: (currentEditor, files, pos) => {
    handleFiles(currentEditor, files, pos);
  },
  onPaste: (currentEditor, files, htmlContent) => {
    // If there is htmlContent, let other extensions handle it
    if (htmlContent) {
      return false;
    }

    const pos = currentEditor.state.selection.anchor;
    handleFiles(currentEditor, files, pos);
  },
});

export { FileHandlerExtension };
