"use server";

import { createClient } from "@/utils/supabase/server";
import { Database } from "@/app/types/database.types";
import { revalidatePath } from "next/cache";

async function updateChat(
  id: string,
  content: Database["public"]["Tables"]["chat"]["Update"]
) {
  const supabase = await createClient();
  await supabase.from("chat").update(content).eq("id", id);
  revalidatePath("/", "layout");
}

async function createChat({
  id = undefined,
  name = "New Chat",
}: {
  name?: string;
  id?: string;
}): Promise<Database["public"]["Tables"]["chat"]["Row"] | null> {
  const supabase = await createClient();
  const idBody = id ? { id } : {};
  const { data, error } = await supabase
    .from("chat")
    .insert({
      name,
      ...idBody,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  revalidatePath("/", "layout");
  return data;
}

async function deleteChat(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("chat").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete chat: ${error.message}`);
  }
  revalidatePath("/", "layout");
}

export { updateChat, createChat, deleteChat };
