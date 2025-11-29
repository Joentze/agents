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
import { memo, type RefObject, type ChangeEvent } from "react";
import type { ChatStatus } from "ai";
import { Button } from "../ui/button";
import { Server } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import ListMcps from "../ui/mcp/list-mcps";

interface ChatInputProps {
  text: string;
  onTextChange: (value: string) => void;
  model: string;
  onModelChange: (value: string) => void;
  status: ChatStatus;
  onSubmit: (message: PromptInputMessage) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  models: Array<{ id: string; name: string; provider: string }>;
  className?: string;
}

const ChatInput = memo(function ChatInput({
  text,
  onTextChange,
  status,
  onSubmit,
  textareaRef,
  className,
}: ChatInputProps) {
  return (
    <Dialog>
      <PromptInput
        className={cn("ring-2 ring-border/50 rounded-md", className)}
        onSubmit={onSubmit}
        globalDrop
        multiple
        accept="text/csv,application/pdf,image/jpeg,image/png"
        maxFiles={10}
        maxFileSize={5 * 1024 * 1024}
      >
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onTextChange(e.target.value)
            }
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
            <DialogTrigger>
              <Button size="icon" variant="ghost">
                <Server />
              </Button>
            </DialogTrigger>

            {/* <PromptInputModelSelect onValueChange={onModelChange} value={model}>
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
          </PromptInputModelSelect> */}
          </PromptInputTools>
          <PromptInputSubmit
            disabled={!text && !status}
            status={status}
            className="border border-muted-foreground ring-2 ring-border/50"
          />
        </PromptInputFooter>
      </PromptInput>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add MCP Servers</DialogTitle>
          <DialogDescription>
            Connect your apps to AI using MCP Servers
          </DialogDescription>
        </DialogHeader>
        <ListMcps />
      </DialogContent>
    </Dialog>
  );
});

export default ChatInput;
