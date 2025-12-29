"use server";

import { createClient } from "@/utils/supabase/server";
import {
  convertFileToPdf,
  isConvertibleFileType,
} from "@/utils/file-converter";

export type FileType = "image" | "document" | "csv";

export type CreateFileParams = {
  name: string;
  type: FileType;
  mimeType: string;
  originalMimeType: string;
  size: number;
  url: string;
};

export type UpdateFileParams = {
  name?: string;
  type?: FileType;
  mimeType?: string;
  originalMimeType?: string;
  size?: number;
  url?: string;
};

export async function createFile(params: CreateFileParams) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file")
    .insert(params)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getFile(fileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file")
    .select("*")
    .eq("id", fileId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getFiles(filters?: {
  type?: FileType;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("file")
    .select("*")
    .order("createdAt", { ascending: false });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 10) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateFile(fileId: string, updates: UpdateFileParams) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file")
    .update(updates)
    .eq("id", fileId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteFile(fileId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("file").delete().eq("id", fileId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getFilesByCreator(createdBy: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file")
    .select("*")
    .eq("createdBy", createdBy)
    .order("createdAt", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Converts a convertible file (office, markdown, html) to PDF
 * @param file - The file to convert
 * @returns The converted PDF file
 * @throws Error if the file is not convertible or conversion fails
 */
export async function convertAndGetPdfFile(file: File): Promise<File> {
  if (!isConvertibleFileType(file.type)) {
    throw new Error(
      `File type ${file.type} is not convertible. Only office documents, markdown, and html files can be converted to PDF.`
    );
  }

  const pdfFile = await convertFileToPdf(file);
  return pdfFile;
}
