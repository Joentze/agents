import {
  adjust,
  convert,
  filename,
  gotenberg,
  HtmlRequest,
  MarkdownRequest,
  OfficeRequest,
  pipe,
  please,
  Request,
  set,
} from "gotenberg-js-client";
import { Buffer } from "node:buffer";

const GOTENBERG_BASE_URL =
  process.env.GOTENBERG_BASE_URL || "https://demo.gotenberg.dev";

const mimetypes: Record<string, string[]> = {
  html: ["text/html"],
  office: [
    "application/vnd.lotus-1-2-3",
    "application/x-t602",
    "application/x-abiword",
    "text/x-bibtex",
    "application/vnd.corel-draw",
    "text/csv",
    "application/x-cwk",
    "application/x-dbf",
    "application/msword",
    "application/vnd.ms-word.document.macroenabled.12",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-word.template.macroenabled.12",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    "application/x-emf",
    "application/postscript",
    "application/epub+zip",
    "application/vnd.oasis.opendocument.graphics-flat-xml",
    "application/vnd.oasis.opendocument.presentation-flat-xml",
    "application/vnd.oasis.opendocument.spreadsheet-flat-xml",
    "application/vnd.oasis.opendocument.text-flat-xml",
    "application/x-font-opendyslexic",
    "application/x-hwp",
    "application/vnd.apple.keynote",
    "application/x-latex",
    "application/vnd.lotus-wordpro",
    "application/vnd.macwriteii",
    "application/x-troff-man",
    "text/mathml",
    "application/vnd.mozilla.xul+xml",
    "application/vnd.apple.numbers",
    "application/x-odd",
    "application/vnd.oasis.opendocument.graphics",
    "application/vnd.oasis.opendocument.text-master",
    "application/vnd.oasis.opendocument.presentation",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.graphics-template",
    "application/vnd.oasis.opendocument.text-web",
    "application/vnd.oasis.opendocument.presentation-template",
    "application/vnd.oasis.opendocument.spreadsheet-template",
    "application/vnd.oasis.opendocument.text-template",
    "application/vnd.apple.pages",
    "application/vnd.palm",
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.ms-powerpoint.template.macroenabled.12",
    "application/vnd.openxmlformats-officedocument.presentationml.template",
    "application/vnd.ms-powerpoint.presentation.macroenabled.12",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/x-powersoftreport",
    "application/x-mspublisher",
    "application/x-pwp",
    "application/vnd.ms-pocketword",
    "application/rtf",
    "application/vnd.stardivision.draw",
    "application/vnd.stardivision.calc",
    "application/vnd.stardivision.impress",
    "application/vnd.stardivision.writer",
    "application/vnd.ms-excel",
    "application/vnd.stardivision.math",
    "application/vnd.sun.xml.calc.template",
    "application/vnd.sun.xml.draw.template",
    "application/vnd.sun.xml.impress.template",
    "application/vnd.sun.xml.writer.template",
    "image/svg+xml",
    "application/x-shockwave-flash",
    "application/vnd.sun.xml.calc",
    "application/vnd.sun.xml.draw",
    "application/vnd.sun.xml.writer.global",
    "application/vnd.sun.xml.impress",
    "application/vnd.sun.xml.math",
    "application/vnd.sun.xml.writer",
    "text/plain",
    "application/x-uof",
    "application/vnd.visio",
    "application/vnd.visio",
    "application/vnd.ms-visio.drawing.macroenabled.12",
    "application/x-quattropro",
    "application/vnd.ms-works",
    "application/x-wmf",
    "application/vnd.wordperfect",
    "application/x-wpg",
    "application/xhtml+xml",
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.binary.macroenabled.12",
    "application/vnd.ms-excel.sheet.macroenabled.12",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel.template.macroenabled.12",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    "application/xml",
  ],
  markdown: ["text/markdown", "text/x-markdown"],
  image: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  pdf: ["application/pdf"],
};

const gotenbergPath: Record<string, string> = {
  office: "/forms/libreoffice/convert",
  markdown: "/forms/chromium/convert/markdown",
  html: "/forms/chromium/convert/html",
};

const gotenbergTypeCast = {
  office: (request: Request) => request as OfficeRequest,
  html: (request: Request) => request as HtmlRequest,
  markdown: (request: Request) => request as MarkdownRequest,
};

export type ConvertibleFileType = "office" | "markdown" | "html";
export type FileType = ConvertibleFileType | "pdf" | "image";

export interface ConversionResult {
  file: File;
  fileType: FileType;
  converted: boolean;
}

/**
 * Determines the file type based on MIME type
 */
export function getFileType(mimeType: string): FileType | undefined {
  if (mimetypes.pdf.includes(mimeType)) {
    return "pdf";
  } else if (mimetypes.image.includes(mimeType)) {
    return "image";
  } else if (mimetypes.office.includes(mimeType)) {
    return "office";
  } else if (mimetypes.markdown.includes(mimeType)) {
    return "markdown";
  } else if (mimetypes.html.includes(mimeType)) {
    return "html";
  }
  return undefined;
}

/**
 * Checks if a file type is convertible to PDF (not PDF or image)
 */
export function isConvertibleFileType(mimeType: string): boolean {
  const fileType = getFileType(mimeType);
  return fileType !== undefined && fileType !== "pdf" && fileType !== "image";
}

/**
 * Checks if a file type is supported (including PDF and images)
 */
export function isSupportedFileType(mimeType: string): boolean {
  return getFileType(mimeType) !== undefined;
}

/**
 * Converts a file (office, markdown, or html) to PDF using Gotenberg.
 * Throws an error if the file is already a PDF, an image, or an unsupported type.
 *
 * @param file - The file to convert (must be office, markdown, or html type)
 * @returns Promise containing the converted PDF file
 * @throws Error if file type is not convertible or conversion fails
 */
export async function convertFileToPdf(file: File): Promise<File> {
  const fileType = getFileType(file.type);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // Reject PDF and image files
  if (fileType === "pdf") {
    throw new Error(
      "File is already a PDF. Use this function only for convertible file types (office, markdown, html)."
    );
  }

  if (fileType === "image") {
    throw new Error(
      "Images cannot be converted to PDF using this function. Use this function only for convertible file types (office, markdown, html)."
    );
  }

  // Convert office, markdown, or html files to PDF using Gotenberg
  const path = gotenbergPath[fileType];
  if (!path) {
    throw new Error(`No conversion path available for file type: ${fileType}`);
  }

  try {
    const fileArrBuff = await file.arrayBuffer();

    // Generate PDF filename
    const pdfFileName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";

    const gotenbergPipe = pipe(
      gotenberg(""),
      convert,
      (request: Request) => gotenbergTypeCast[fileType](request),
      adjust({
        url: `${GOTENBERG_BASE_URL}${path}`,
      }),
      set(filename(pdfFileName)),
      please
    );

    const buffer = Buffer.from(fileArrBuff);
    const pdfStream = await gotenbergPipe(buffer);

    // Collect the PDF stream into chunks
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }

    // Create a new PDF file
    const pdfBlob = new Blob(chunks, { type: "application/pdf" });
    const pdfFile = new File([pdfBlob], pdfFileName, {
      type: "application/pdf",
    });

    return pdfFile;
  } catch (error) {
    throw new Error(
      `Failed to convert ${fileType} file to PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Gets all supported MIME types
 */
export function getSupportedMimeTypes(): string[] {
  return [
    ...mimetypes.pdf,
    ...mimetypes.image,
    ...mimetypes.office,
    ...mimetypes.markdown,
    ...mimetypes.html,
  ];
}

/**
 * Gets only convertible MIME types (excluding PDF and images)
 */
export function getConvertibleMimeTypes(): string[] {
  return [...mimetypes.office, ...mimetypes.markdown, ...mimetypes.html];
}
