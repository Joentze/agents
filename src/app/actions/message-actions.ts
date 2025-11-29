"use server";

import { createClient } from "@/utils/supabase/server";
import { Database } from "@/app/types/database.types";

type Message = Database["public"]["Tables"]["message"]["Insert"];
async function createMessage(chatId: string, message: Message | Message[]) {
  const supabase = await createClient();
  await supabase
    .from("message")
    .insert(Array.isArray(message) ? message : [message])
    .eq("chatId", chatId);
}

export { createMessage };
