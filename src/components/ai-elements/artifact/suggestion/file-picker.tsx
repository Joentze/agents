"use client";

import { useEffect, useRef } from "react";
import { useFilePickerStore } from "@/stores/use-file-picker";

const imageMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const documentMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "application/csv",
];

const allMimeTypes = [...imageMimeTypes, ...documentMimeTypes];

function isImageMimeType(mimeType: string): boolean {
  return imageMimeTypes.includes(mimeType);
}

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

export function FilePicker() {
  const { editor, type, clearPicker } = useFilePickerStore();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editor) {
      // Trigger the appropriate file input based on type
      if (type === "image" && imageInputRef.current) {
        imageInputRef.current.click();
      } else if (type === "file" && fileInputRef.current) {
        fileInputRef.current.click();
      } else if (type === "all" && allInputRef.current) {
        allInputRef.current.click();
      }
    }
  }, [editor, type]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editor) {
      clearPicker();
      return;
    }

    const file = files[0];
    const pos = editor.state.selection.anchor;

    const result = await uploadFile(file);

    if (result) {
      const insertType = isImageMimeType(file.type) ? "image" : "document";

      if (insertType === "image") {
        editor
          .chain()
          .focus()
          .insertContentAt(pos, {
            type: "image",
            attrs: {
              src: result.url,
              alt: result.originalFilename,
            },
          })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContentAt(pos, {
            type: "fileAttachment",
            attrs: {
              url: result.url,
              filename: result.originalFilename,
              originalMimeType: file.type,
            },
          })
          .run();
      }
    }

    // Reset the input value so the same file can be selected again
    e.target.value = "";
    clearPicker();
  };

  return (
    <>
      {/* Hidden file input for images only */}
      <input
        ref={imageInputRef}
        type="file"
        accept={imageMimeTypes.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Hidden file input for documents only */}
      <input
        ref={fileInputRef}
        type="file"
        accept={documentMimeTypes.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Hidden file input for all file types */}
      <input
        ref={allInputRef}
        type="file"
        accept={allMimeTypes.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
