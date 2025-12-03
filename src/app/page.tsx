"use client";

import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useCallback, useRef, useState, memo } from "react";
import { useAiChat as useChat } from "@/hooks/chat/use-ai-chat";
import ChatInput from "@/components/ai-elements/chat-input";
import ChatConversation from "@/components/ai-elements/chat-conversation";

import { cn } from "@/lib/utils";

import { useAppBuilder } from "@/hooks/app-builder/use-app-builder";
import { useArtifactStore } from "@/hooks/artifact/use-artifact";
import { UIMessage } from "ai";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useTempStore } from "@/hooks/chat/use-temp-store";
import { McpTool } from "@/stores/use-mcps";
import { useIsMobile } from "@/hooks/use-mobile";
import { createChat } from "./actions/chat-actions";
const models = [
  // { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B", provider: "openai" },
  {
    id: "moonshotai/kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    provider: "moonshotai",
  },
  { id: "openai/gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "openai" },
  {
    id: "anthropic/claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    provider: "anthropic",
  },
];

// Memoized chat section to prevent unnecessary re-renders
const ChatSection = memo(
  ({
    mcpTools,
    mcpLoading,
    messages,
    status,
    text,
    onTextChange,
    model,
    onModelChange,
    onSubmit,
    textareaRef,
    hasArtifact,
    hasAppBuilder,
  }: {
    mcpTools: Record<string, McpTool>;
    mcpLoading: boolean;
    messages: UIMessage[];
    status: any;
    text: string;
    onTextChange: (value: string) => void;
    model: string;
    onModelChange: (value: string) => void;
    onSubmit: (message: PromptInputMessage) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    hasArtifact: boolean;
    hasAppBuilder: boolean;
  }) => {
    return (
      <div
        className={cn(
          "h-screen flex flex-col p-4 mx-auto",
          hasArtifact ? "w-full" : "w-full md:w-2/3",
          hasAppBuilder ? "w-full" : "w-full md:w-2/3"
        )}
      >
        {/* <ChatConversation
          messages={messages}
          status={status}
          className="flex-1 overflow-auto"
        /> */}

        <ChatInput
          mcpLoading={mcpLoading}
          mcpTools={mcpTools}
          className="my-auto"
          text={text}
          onTextChange={onTextChange}
          model={model}
          onModelChange={onModelChange}
          status={status}
          onSubmit={onSubmit}
          textareaRef={textareaRef}
          models={models}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.messages === nextProps.messages &&
      prevProps.status === nextProps.status &&
      prevProps.text === nextProps.text &&
      prevProps.model === nextProps.model &&
      prevProps.hasArtifact === nextProps.hasArtifact &&
      prevProps.hasAppBuilder === nextProps.hasAppBuilder
    );
  }
);

const InputDemo = () => {
  const router = useRouter();
  const { open, setOpen } = useSidebar();
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, status, sendMessage, mcpTools, mcpLoading } = useChat({});
  const isMobile = useIsMobile();
  // Subscribe to these separately to avoid unnecessary re-renders
  const currentArtifact = useArtifactStore((state) => state.currentArtifact);

  const appBuilderStatus = useAppBuilder((state) => state.status);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
  }, []);

  const handleModelChange = useCallback((value: string) => {
    setModel(value);
  }, []);

  const handleFirstSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      const tabularFiles = message.files?.filter(
        (file) =>
          file.mediaType === "text/csv" ||
          file.mediaType === "application/vnd.ms-excel" ||
          file.mediaType ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      const nonTabularFiles = message.files?.filter(
        (file) =>
          file.mediaType !== "text/csv" &&
          file.mediaType !== "application/vnd.ms-excel" &&
          file.mediaType !==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const chatId = crypto.randomUUID();

      const firstMessage = {
        message: {
          text: message.text || "Sent with attachments",
          files: nonTabularFiles,
          metadata: { tabularFiles, first: true },
        },
        chatRequestOptions: {
          body: {
            model: model,
            mcpTools: Object.values(mcpTools),
            chatId,
          },
        },
      };
      createChat({ id: chatId, name: "New Chat" });
      useTempStore.getState().setKey(chatId, firstMessage);

      router.push(`/chat/${chatId}`);
    },
    [model, sendMessage]
  );

  return (
    <>
      <div className="flex flex-row h-screen w-full ">
        {/* <Dithering
          colorFront="#737373"
          colorBack="#0a0a0a"
          shape="wave"
          type="4x4"
          size={1.3}
          speed={0.24}
          scale={0.8}
          offsetX={-1}
          offsetY={0.2}
          className="absolute top-0 left-0 w-full h-full"
        /> */}
        {(!open || isMobile) && (
          <SidebarTrigger
            onClick={() => setOpen(!open)}
            className="m-2 absolute top-0 left-0 z-10"
          />
        )}
        <ChatSection
          mcpTools={mcpTools}
          mcpLoading={mcpLoading}
          messages={messages}
          status={status}
          text={text}
          onTextChange={handleTextChange}
          model={model}
          onModelChange={handleModelChange}
          onSubmit={handleFirstSubmit}
          textareaRef={textareaRef}
          hasArtifact={!!currentArtifact}
          hasAppBuilder={appBuilderStatus !== "not-started"}
        />
      </div>
    </>
  );
};

export default InputDemo;
