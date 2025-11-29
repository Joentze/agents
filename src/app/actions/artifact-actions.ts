"use server";

import { createClient } from "@/utils/supabase/server";
import { Database } from "../types/database.types";

async function createArtifact(
  content: Database["public"]["Tables"]["artifact"]["Insert"]
) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("artifact").insert(content);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export { createArtifact };
