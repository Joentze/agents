"use client";
import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useCallback, useRef, useState, memo, useEffect } from "react";
import { useAiChat as useChat } from "@/hooks/chat/use-ai-chat";
import ChatInput from "@/components/ai-elements/chat-input";
import ChatConversation from "@/components/ai-elements/chat-conversation";

import { ArtifactRenderer } from "@/components/ai-elements/artifact/artifact-renderer";
import { cn } from "@/lib/utils";
import AppBuilderRenderer from "@/components/ai-elements/app-builder/app-builder-renderer";
import { useAppBuilder } from "@/hooks/app-builder/use-app-builder";
import { ArtifactBody, useArtifactStore } from "@/hooks/artifact/use-artifact";
import { ChatRequestOptions, UIMessage } from "ai";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";

import { useParams } from "next/navigation";
import { useTempStore } from "@/hooks/chat/use-temp-store";
import { useChatData } from "./chat-data-provider";
import { Database } from "@/app/types/database.types";
import { useIsMobile } from "@/hooks/use-mobile";
import { McpTool } from "@/stores/use-mcps";
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
    mcpLoading,
    messages,
    status,
    text,
    onTextChange,
    model,
    onModelChange,
    onSubmit,
    textareaRef,
    mcpTools,
    hasArtifact,
    hasAppBuilder,
  }: {
    mcpLoading: boolean;
    messages: UIMessage[];
    status: any;
    text: string;
    onTextChange: (value: string) => void;
    model: string;
    onModelChange: (value: string) => void;
    onSubmit: (message: PromptInputMessage) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    mcpTools: Record<string, McpTool>;
    hasArtifact: boolean;
    hasAppBuilder: boolean;
  }) => {
    return (
      <div className="h-screen flex flex-col p-4">
        <ChatConversation
          messages={messages}
          status={status}
          className="flex-1 min-h-0"
        />

        <ChatInput
          mcpTools={mcpTools}
          mcpLoading={mcpLoading}
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
  const isMobile = useIsMobile();
  const { initialMessages, initialArtifacts } = useChatData();
  const { chatId } = useParams();
  if (!chatId) {
    // TODO: improve this
    return <div>No chat ID</div>;
  }
  const message = useTempStore((state) => state.messages[chatId as string]);
  const { open, setOpen } = useSidebar();
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialMessageBeenSent = useRef(false);
  const { messages, status, sendMessage, mcpTools, mcpLoading, userLocation } =
    useChat({
      messages: initialMessages ?? [],
      chatId: chatId as string,
    });
  useEffect(() => {
    if (initialArtifacts) {
      const artifacts = initialArtifacts.reduce(
        (
          acc: Record<string, ArtifactBody>,
          artifact: Database["public"]["Tables"]["artifact"]["Row"]
        ) => {
          acc[artifact.callId ?? ""] = {
            content: artifact.content,
            title: artifact.title,
            description: artifact.description,
            plan: "",
          };
          return acc;
        },
        {} as Record<string, ArtifactBody>
      );
      console.log("artifacts", artifacts);
      useArtifactStore.setState({ artifacts });
    }
  }, [initialArtifacts]);
  // Subscribe to these separately to avoid unnecessary re-renders
  const currentArtifact = useArtifactStore((state) => state.currentArtifact);
  const artifacts = useArtifactStore((state) => state.artifacts);
  const appBuilderStatus = useAppBuilder((state) => state.status);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
  }, []);

  const handleModelChange = useCallback((value: string) => {
    setModel(value);
  }, []);
  // Send initial message only once when component mounts
  useEffect(() => {
    if (message && !hasInitialMessageBeenSent.current) {
      hasInitialMessageBeenSent.current = true;
      const { message: initialMessage, chatRequestOptions } =
        useTempStore.getState().messages[chatId as string];

      sendMessage(
        initialMessage as any,
        chatRequestOptions as ChatRequestOptions
      );

      useTempStore.getState().removeKey(chatId as string);
    }
  }, [message, chatId, sendMessage]);
  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
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

      sendMessage(
        {
          text: message.text || "Sent with attachments",
          files: nonTabularFiles,
          metadata: { tabularFiles, first: false },
        },
        {
          body: {
            model: model,
            mcpTools: Object.values(mcpTools),
            chatId,
            userLocation,
          },
        }
      );

      setText("");
    },
    [model, sendMessage]
  );

  return (
    <>
      {(!open || isMobile) && (
        <SidebarTrigger
          onClick={() => setOpen(!open)}
          className="m-2 absolute top-0 left-0 z-10"
        />
      )}
      <div
        className={cn(
          "flex h-screen w-full overflow-hidden",
          currentArtifact || appBuilderStatus !== "not-started"
            ? "flex-row gap-4"
            : ""
        )}
      >
        <div
          className={cn(
            currentArtifact || appBuilderStatus !== "not-started"
              ? "flex-1 h-screen min-w-0"
              : "md:w-2/3 w-full mx-auto"
          )}
        >
          <ChatSection
            mcpLoading={mcpLoading}
            mcpTools={mcpTools}
            messages={messages}
            status={status}
            text={text}
            onTextChange={handleTextChange}
            model={model}
            onModelChange={handleModelChange}
            onSubmit={handleSubmit}
            textareaRef={textareaRef}
            hasArtifact={!!currentArtifact}
            hasAppBuilder={appBuilderStatus !== "not-started"}
          />
        </div>

        {currentArtifact && artifacts[currentArtifact] && (
          <div className="flex-1 h-screen min-w-2/3">
            <ArtifactRenderer artifactId={currentArtifact} />
          </div>
        )}
        {!currentArtifact && appBuilderStatus !== "not-started" && (
          <div className="flex-1 h-screen min-w-2/3">
            <AppBuilderRenderer />
          </div>
        )}
      </div>
    </>
  );
};

export default InputDemo;
