import { createClient } from "@/utils/supabase/server";
import { ReactNode } from "react";
import { ChatDataProvider } from "./chat-data-provider";

interface ChatLayoutProps {
  children: ReactNode;
  params: Promise<{ chatId: string }>; // In Next.js 15, params is a Promise
}

export default async function ChatLayout({
  children,
  params,
}: ChatLayoutProps) {
  // Await the params promise
  const { chatId } = await params;

  const supabase = await createClient();

  // Fetch all data in parallel for better performance
  const [
    { data: messages, error: messagesError },
    { data: artifacts, error: artifactsError },
    { data: apps, error: appsError },
  ] = await Promise.all([
    supabase
      .from("message")
      .select("*")
      .eq("chatId", chatId)
      .order("created_at", { ascending: true }),
    supabase.from("artifact").select("*").eq("chatId", chatId),
    supabase.from("app").select("*").eq("chatId", chatId),
  ]);

  // You can pass this data down via props or context
  // For now, just rendering children
  return (
    <ChatDataProvider
      initialMessages={messages}
      initialArtifacts={artifacts}
      initialApps={apps}
    >
      {children}
    </ChatDataProvider>
  );
}
