import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  convertFileToPdf,
  getSupportedMimeTypes,
  isConvertibleFileType,
} from "@/utils/file-converter";
import { createFile, type FileType } from "@/app/actions/file-actions";

const supportedMimeTypes = getSupportedMimeTypes();

/**
 * Maps a MIME type to the database file type enum
 */
function mapMimeTypeToFileType(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType === "text/csv" || mimeType === "application/csv") {
    return "csv";
  }
  // Everything else (PDFs, office docs) is a document
  return "document";
}

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: "File size should be less than 50MB",
    })
    .refine((file) => supportedMimeTypes.includes(file.type), {
      message: `File type not supported. Supported types: PDF, Images (PNG, JPEG, WebP), Office documents (Word, Excel, PowerPoint), Markdown, and HTML files.`,
    }),
});

export async function POST(request: Request) {
  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Store original file information
    const originalFilename = file.name;
    const originalMimeType = file.type;
    let fileToUpload: File = file;
    let uploadFilename = originalFilename;
    let finalMimeType = originalMimeType;
    let converted = false;

    // Convert file to PDF if it's a convertible type (office, markdown, html)
    if (isConvertibleFileType(originalMimeType)) {
      try {
        console.log(
          `Converting ${originalFilename} (${originalMimeType}) to PDF...`
        );
        fileToUpload = await convertFileToPdf(file);
        uploadFilename = fileToUpload.name;
        finalMimeType = "application/pdf";
        converted = true;
        console.log(`Conversion successful: ${uploadFilename}`);
      } catch (error) {
        console.error("Conversion failed:", error);
        return NextResponse.json(
          {
            error: `Failed to convert file to PDF: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
          { status: 500 }
        );
      }
    }

    // Upload the file (either original or converted PDF)
    const fileBuffer = await fileToUpload.arrayBuffer();

    try {
      const data = await put(`${nanoid(10)}-${uploadFilename}`, fileBuffer, {
        access: "public",
        contentType: finalMimeType,
      });

      // Create database record
      const fileId = nanoid();
      const fileType = mapMimeTypeToFileType(finalMimeType);

      try {
        await createFile({
          name: originalFilename,
          type: fileType,
          mimeType: finalMimeType,
          originalMimeType: originalMimeType,
          size: fileBuffer.byteLength,
          url: data.url,
        });

        console.log(`File record created in database: ${fileId}`);
      } catch (dbError) {
        console.error("Failed to create database record:", dbError);
        // Continue even if database insert fails - file is already uploaded
      }

      return NextResponse.json({
        ...data,
        fileId,
        originalFilename,
        originalMimeType,
        converted,
        finalMimeType,
        fileType,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Request processing failed:", error);
    return NextResponse.json(
      {
        error: `Failed to process request: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
