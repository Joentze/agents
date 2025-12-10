"use server";

import { createClient } from "@/utils/supabase/server";
import { Database } from "../types/database.types";

async function createArtifact(
  content: Database["public"]["Tables"]["artifact"]["Insert"]
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artifact")
    .insert(content)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
async function getArtifact(artifactId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artifact")
    .select("*")
    .eq("id", artifactId)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function updateArtifact(
  artifactId: string,
  content: Database["public"]["Tables"]["artifact"]["Update"]
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artifact")
    .update(content)
    .eq("id", artifactId)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function getArtifacts(page: number = 1, limit: number = 10) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  // Get artifacts that don't belong to any folder (folderId is null)
  const { data, error, count } = await supabase
    .from("artifact")
    .select("*", { count: "exact" })
    .is("folderId", null)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    throw new Error(error.message);
  }

  return { data, count };
}

// Artifact Folder CRUD operations

async function createArtifactFolder(
  content: Database["public"]["Tables"]["artifact_folder"]["Insert"]
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artifact_folder")
    .insert(content)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function getArtifactFolders(parentFolderId?: string | null) {
  const supabase = await createClient();
  let query = supabase
    .from("artifact_folder")
    .select("*")
    .order("updated_at", { ascending: false });

  // If parentFolderId is explicitly null or undefined, get top-level folders
  if (parentFolderId === null || parentFolderId === undefined) {
    query = query.is("parent_folder_id", null);
  } else {
    query = query.eq("parent_folder_id", parentFolderId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getArtifactFolder(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artifact_folder")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateArtifactFolder(
  id: string,
  content: Database["public"]["Tables"]["artifact_folder"]["Update"]
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artifact_folder")
    .update(content)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function deleteArtifactFolder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("artifact_folder")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

// Artifact-Folder operations

async function moveArtifactToFolder(
  artifactId: string,
  folderId: string | null
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artifact")
    .update({ folderId })
    .eq("id", artifactId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getArtifactsInFolder(
  folderId: string,
  page: number = 1,
  limit: number = 10
) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data, error, count } = await supabase
    .from("artifact")
    .select("*", { count: "exact" })
    .eq("folderId", folderId)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    throw new Error(error.message);
  }

  return { data, count };
}

async function moveFolderToFolder(
  folderId: string,
  parentFolderId: string | null
) {
  const supabase = await createClient();

  // Prevent circular references by checking if parentFolderId is a descendant of folderId
  if (parentFolderId) {
    let currentParentId: string | null = parentFolderId;
    while (currentParentId) {
      if (currentParentId === folderId) {
        throw new Error("Cannot move folder into its own descendant");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await supabase
        .from("artifact_folder")
        .select("parent_folder_id")
        .eq("id", currentParentId)
        .maybeSingle();

      currentParentId = response.data?.parent_folder_id || null;
    }
  }

  const { data, error } = await supabase
    .from("artifact_folder")
    .update({ parent_folder_id: parentFolderId })
    .eq("id", folderId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getFolderPath(folderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_folder_path", {
    folder_id: folderId,
  });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  return data as Database["public"]["Tables"]["artifact_folder"]["Row"][];
}

export {
  createArtifact,
  getFolderPath,
  getArtifact,
  updateArtifact,
  getArtifacts,
  createArtifactFolder,
  getArtifactFolders,
  getArtifactFolder,
  updateArtifactFolder,
  deleteArtifactFolder,
  moveArtifactToFolder,
  getArtifactsInFolder,
  moveFolderToFolder,
};
