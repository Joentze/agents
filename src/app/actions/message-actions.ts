"use server";

import { createClient } from "@/utils/supabase/server";
import { Database } from "@/app/types/database.types";

type Message = Database["public"]["Tables"]["message"]["Insert"];
async function createMessage(chatId: string, message: Message | Message[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("message")
    .insert(Array.isArray(message) ? message : [message])
    .eq("chatId", chatId);
  if (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }
}

export { createMessage };
