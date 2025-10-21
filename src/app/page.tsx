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
import { useEffect, useRef, useState } from "react";
import { useAiChat as useChat } from "@/hooks/chat/use-ai-chat";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Globe, SearchIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ai-elements/shimmer";

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

  const { messages, status, sendMessage, searchResults } = useChat();

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
    <div className="h-screen flex flex-col w-full p-4">
      <Conversation className="flex-1 overflow-auto ">
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <Response key={`${message.id}-${i}`}>
                          {part.text}
                        </Response>
                      );
                    case "tool-agenticSearch":
                      return (
                        <ChainOfThought defaultOpen={true}>
                          <ChainOfThoughtHeader
                            className="flex flex-row gap-2"
                            icon={Globe}
                          >
                            {part.state === "output-available" ? (
                              "Searched the Web"
                            ) : (
                              <Shimmer>Searching the Web</Shimmer>
                            )}
                          </ChainOfThoughtHeader>

                          {searchResults && (
                            <ChainOfThoughtContent>
                              {Object.entries(searchResults).map(
                                ([id, topic]) => (
                                  <ChainOfThoughtStep
                                    key={id}
                                    icon={SearchIcon}
                                    label={`Searching for ${topic.query}`}
                                    status={
                                      topic.results.length > 0
                                        ? "complete"
                                        : "pending"
                                    }
                                  >
                                    <ChainOfThoughtSearchResults>
                                      {topic.results.map(({ url, title }) => (
                                        <ChainOfThoughtSearchResult
                                          className="border border-border cursor-pointer rounded-md p-1 ring-1 ring-border/50 bg-muted/50 truncate"
                                          key={url}
                                          onClick={() => {
                                            window.open(url, "_blank");
                                          }}
                                        >
                                          <Image
                                            alt=""
                                            className="size-4"
                                            height={16}
                                            src={`https://img.logo.dev/${
                                              new URL(url).hostname
                                            }?token=${
                                              process.env
                                                .NEXT_PUBLIC_LOGO_DEV_TOKEN
                                            }`}
                                            width={16}
                                          />
                                          {new URL(url).hostname}
                                        </ChainOfThoughtSearchResult>
                                      ))}
                                    </ChainOfThoughtSearchResults>
                                  </ChainOfThoughtStep>
                                )
                              )}
                            </ChainOfThoughtContent>
                          )}
                        </ChainOfThought>
                      );
                    default:
                      return null;
                  }
                })}
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
                  <PromptInputModelSelectItem key={model.id} value={model.id}>
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
  );
};

export default InputDemo;
