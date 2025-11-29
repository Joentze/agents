"use client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
  MessageResponse,
  MessageAttachments,
  MessageAttachment,
} from "@/components/ai-elements/message";

import ChainOfThoughtDisplay from "@/components/ai-elements/chain-of-thought-display";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { ArtifactPlanDisplay } from "@/components/ai-elements/artifact/artifact-plan-display";
import { ArtifactInput } from "@/app/types/artifact";
import { Fragment, memo } from "react";
import type { ChatStatus, UIMessage, UIDataTypes, UITools } from "ai";
import { CopyIcon } from "lucide-react";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";

interface ChatConversationProps {
  messages: UIMessage<unknown, UIDataTypes, UITools>[];
  status: ChatStatus;
  className?: string;
}

const ChatConversation = memo(
  function ChatConversation({
    messages,
    status,
    className,
  }: ChatConversationProps) {
    return (
      <Conversation className={className}>
        <ConversationContent className="space-y-6">
          {messages.map((message, index) => (
            <Fragment key={message.id}>
              <Message from={message.role} key={message.id}>
                {message.parts.some((part) => part.type === "file") && (
                  <MessageAttachments className="mb-2">
                    {message.parts
                      .filter((part) => part.type === "file")
                      .map((part, i) => (
                        <MessageAttachment
                          data={part}
                          key={`${message.id}-${i}`}
                        />
                      ))}
                  </MessageAttachments>
                )}
                <MessageContent className="text-md">
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      case "reasoning":
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={
                              status === "streaming" &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      case "tool-agenticSearch":
                      case "tool-agenticCode":
                      case "tool-agenticDataAnalysis":
                      case "tool-agenticArtifact":
                      case "tool-agenticFileCreator":
                        return (
                          <>
                            <ChainOfThoughtDisplay
                              runId={part.toolCallId}
                              key={`${message.id}-${i}`}
                            />
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
                      <Sources className="">
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
                                    title={part.title}
                                  />
                                </SourcesContent>
                              );
                          }
                        })}
                      </Sources>
                    )}
                </MessageContent>
                {message.role === "assistant" && status === "ready" && (
                  <MessageActions className="">
                    <MessageAction
                      onClick={() => {
                        navigator.clipboard.writeText(
                          message.parts
                            .filter((part) => part.type === "text")
                            .map((part) => part.text)
                            .join("\n")
                        );
                      }}
                    >
                      <CopyIcon className="size-4 text-muted-foreground" />
                    </MessageAction>
                  </MessageActions>
                )}
              </Message>
            </Fragment>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.messages === nextProps.messages &&
      prevProps.status === nextProps.status
    );
  }
);

export default ChatConversation;
