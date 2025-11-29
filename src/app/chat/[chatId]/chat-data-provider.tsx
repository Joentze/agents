"use client";

import { createContext, useContext, ReactNode } from "react";
import { Database } from "@/app/types/database.types";

type Message = Database["public"]["Tables"]["message"]["Row"];
type Artifact = Database["public"]["Tables"]["artifact"]["Row"];
type App = Database["public"]["Tables"]["app"]["Row"];

interface ChatDataContextType {
  initialMessages: Message[] | null;
  initialArtifacts: Artifact[] | null;
  initialApps: App[] | null;
}

const ChatDataContext = createContext<ChatDataContextType | null>(null);

interface ChatDataProviderProps {
  children: ReactNode;
  initialMessages: Message[] | null;
  initialArtifacts: Artifact[] | null;
  initialApps: App[] | null;
}

export function ChatDataProvider({
  children,
  initialMessages,
  initialArtifacts,
  initialApps,
}: ChatDataProviderProps) {
  return (
    <ChatDataContext.Provider
      value={{ initialMessages, initialArtifacts, initialApps }}
    >
      {children}
    </ChatDataContext.Provider>
  );
}

export function useChatData() {
  const context = useContext(ChatDataContext);
  if (!context) {
    throw new Error("useChatData must be used within ChatDataProvider");
  }
  return context;
}
