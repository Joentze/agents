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
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { memo, type RefObject, type ChangeEvent } from "react";
import type { ChatStatus } from "ai";

import { ServerIcon, Wrench } from "lucide-react";
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
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { McpTool } from "@/stores/use-mcps";
import { Badge } from "../ui/badge";
import { Loader } from "./loader";

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
  mcpTools: Record<string, McpTool>;
  mcpLoading: boolean;
}

const ChatInput = memo(function ChatInput({
  mcpLoading,
  mcpTools,
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
        accept="text/csv,application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/html,text/markdown,text/plain"
        maxFiles={10}
        maxFileSize={50 * 1024 * 1024}
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
                <DialogTrigger asChild>
                  <DropdownMenuItem>
                    <ServerIcon className="size-4 mr-2" />
                    <span>Add MCP Server</span>
                  </DropdownMenuItem>
                </DialogTrigger>
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>

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
            {Object.keys(mcpTools).length > 0 && (
              <DialogTrigger asChild disabled={mcpLoading}>
                <Badge
                  variant="outline"
                  className="p-2 rounded-sm hover:bg-accent/50 cursor-pointer"
                >
                  {!mcpLoading ? (
                    <>
                      {Object.keys(mcpTools).length}
                      <Wrench />
                    </>
                  ) : (
                    <Loader />
                  )}{" "}
                </Badge>
              </DialogTrigger>
            )}
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
