"use client";

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useRef, useState } from "react";
import { useAiChat as useChat } from "@/hooks/chat/use-ai-chat";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";

import { ModeToggle } from "@/components/ui/theme-button";
import ChainOfThoughtDisplay from "@/components/ai-elements/chain-of-thought-display";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { ArtifactPlanDisplay } from "@/components/ai-elements/artifact/artifact-plan-display";
import { ArtifactInput } from "./types/artifact";
import { ArtifactRenderer } from "@/components/ai-elements/artifact/artifact-renderer";
import { cn } from "@/lib/utils";

const models = [
  { id: "openai/gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "openai" },
  {
    id: "anthropic/claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    provider: "anthropic",
  },
];

const InputDemo = () => {
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, status, sendMessage, currentArtifact, artifacts } =
    useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model: model,
        },
      }
    );
    setText("");
  };

  return (
    <>
      <div className="flex flex-row h-screen w-full">
        <div
          className={cn(
            "h-screen flex flex-col p-4 mx-auto",
            currentArtifact ? "w-full" : "w-full md:w-2/3"
          )}
        >
          <ModeToggle />
          <Conversation className="flex-1 overflow-auto">
            <ConversationContent>
              {messages.map((message, index) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent variant="flat">
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <Response key={`${message.id}-${i}`}>
                              {part.text}
                            </Response>
                          );
                        case "tool-agenticSearch":
                        case "tool-agenticCode":
                        case "tool-agenticArtifact":
                          return (
                            <>
                              <ChainOfThoughtDisplay runId={part.toolCallId} />
                              {part.type === "tool-agenticArtifact" &&
                                part.output && (
                                  <ArtifactPlanDisplay
                                    id={part.toolCallId}
                                    artifact={part.input as ArtifactInput}
                                    isLoading={part.state === "input-streaming"}
                                  />
                                )}
                            </>
                          );
                        default:
                          return null;
                      }
                    })}
                    {message.role === "assistant" &&
                      index === messages.length - 1 &&
                      status === "ready" &&
                      message.parts.some(
                        (part) => part.type === "source-url"
                      ) && (
                        <Sources className="mt-2">
                          <SourcesTrigger
                            className="text-blue-400 hover:text-blue-700"
                            count={
                              message.parts.filter(
                                (part) => part.type === "source-url"
                              ).length
                            }
                          />
                          {message.parts.map((part, i) => {
                            switch (part.type) {
                              case "source-url":
                                return (
                                  <SourcesContent key={`${message.id}-${i}`}>
                                    <Source
                                      key={`${message.id}-${i}`}
                                      href={part.url}
                                      title={part.url}
                                    />
                                  </SourcesContent>
                                );
                            }
                          })}
                        </Sources>
                      )}
                  </MessageContent>
                </Message>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput onSubmit={handleSubmit} globalDrop multiple>
            <PromptInputBody className="pt-2">
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                onChange={(e) => setText(e.target.value)}
                ref={textareaRef}
                value={text}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>

                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setModel(value);
                  }}
                  value={model}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map((model) => (
                      <PromptInputModelSelectItem
                        key={model.id}
                        value={model.id}
                      >
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!text && !status}
                status={status}
                className="border border-muted-foreground ring-2 ring-border/50"
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
        {currentArtifact && artifacts[currentArtifact] && (
          <ArtifactRenderer artifactId={currentArtifact} />
        )}
      </div>
    </>
  );
};

export default InputDemo;
