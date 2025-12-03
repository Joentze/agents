"use server";

import { createClient } from "@/utils/supabase/server";
import { Database } from "@/app/types/database.types";
import { revalidatePath } from "next/cache";

async function updateChat(
  id: string,
  content: Database["public"]["Tables"]["chat"]["Update"]
) {
  const supabase = await createClient();
  const { error } = await supabase.from("chat").update(content).eq("id", id);
  if (error) {
    console.log(300, error);
    throw new Error(`Failed to update chat: ${error.message}`);
  }

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

async function getChats(
  offset: number,
  limit: number
): Promise<Database["public"]["Tables"]["chat"]["Row"][]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat")
    .select("*")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch chats: ${error.message}`);
  }
  return data || [];
}
export { updateChat, createChat, deleteChat, getChats };
