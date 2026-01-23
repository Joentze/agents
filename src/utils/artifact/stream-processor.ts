import type { UIMessageStreamWriter } from "ai";
import type { ArtifactPart } from "@/app/types/artifact";

type ToolCallChunk = {
  toolName: string;
  toolCallId: string;
  input: unknown;
};

type StreamEventType = "data-artifact-delta" | "data-artifact-agent-chat-delta";

type StreamProcessorConfig = {
  writer: UIMessageStreamWriter;
  runId: string;
  eventType: StreamEventType;
};

/**
 * Formats a tool call into a markdown component directive
 */
function formatToolComponent(chunk: ToolCallChunk): {
  componentName: string;
  content: string;
} {
  const toolComponentMap: Record<string, string> = {
    flashCardTool: "flashcard",
    mcqTool: "mcq",
    openEndedTool: "openended",
  };

  const componentName = toolComponentMap[chunk.toolName] ?? chunk.toolName;
  const payload =
    chunk.toolName === "flashCardTool"
      ? chunk.input
      : { ...(chunk.input as object), id: chunk.toolCallId };

  const content = `:::${componentName} {type="${chunk.toolName}"}

${JSON.stringify(payload)}

:::`;

  return { componentName, content };
}

/**
 * Creates an ArtifactPart for text content
 */
function createTextPart(text: string): ArtifactPart {
  return {
    type: "text",
    content: text,
  };
}

/**
 * Creates an ArtifactPart for a custom component
 */
function createComponentPart(content: string): ArtifactPart {
  return {
    type: "custom-component",
    content: `
    ${content}
    `,
  };
}

/**
 * Writes a text delta to the stream
 */
function writeTextDelta(
  config: StreamProcessorConfig,
  text: string,
  usePartFormat: boolean = false
) {
  const { writer, runId, eventType } = config;

  writer.write({
    type: eventType,
    id: runId,
    data: {
      delta: usePartFormat ? createTextPart(text) : text,
    },
  });
  return text;
}

/**
 * Writes a component delta to the stream
 */
function writeComponentDelta(
  config: StreamProcessorConfig,
  chunk: ToolCallChunk,
  usePartFormat: boolean = false
): string {
  const { writer, runId, eventType } = config;
  const { content } = formatToolComponent(chunk);

  writer.write({
    type: eventType,
    id: runId,
    data: {
      delta: usePartFormat ? createComponentPart(content) : content,
    },
  });

  return content;
}

export {
  formatToolComponent,
  createTextPart,
  createComponentPart,
  writeTextDelta,
  writeComponentDelta,
};
export type { StreamProcessorConfig, ToolCallChunk, StreamEventType };
