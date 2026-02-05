import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UserModelMessage,
  type ModelMessage,
  type UIMessageStreamWriter,
} from "ai";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  writeTextDelta,
  writeComponentDelta,
  type StreamProcessorConfig,
  type ToolCallChunk,
} from "@/utils/artifact/stream-processor";
import { componentTools } from "@/utils/artifact/component-tools";

const artifactSchema = z.object({
  index: z.number(),
  instructions: z
    .string()
    .describe(
      "instructions for what kind of markdown content needs to be generated"
    ),
});

function insertMarkdownIntoArtifactTool({
  writer,
  messages,
}: {
  writer: UIMessageStreamWriter;
  messages: ModelMessage[];
}) {
  return tool({
    description: "Write  the artifact with the new content",
    inputSchema: artifactSchema,
    execute: async ({ index, instructions }) => {
      // use streamText to stream the whole update to the front end to
      // create scrolling text like in cursor
      // the output of this will be the full edited artifact
      // this will then be sent to the front end, where diffs will be compared for approval by the user

      // Add update instructions as a new user message
      const appendedInstructions: ModelMessage[] = [...messages, {
        role: "user",
        content: `Based on the preceding context, Write markdown for the following instructions: ${instructions}`,
      } as UserModelMessage];
      const { fullStream } = streamText({
        model: "anthropic/claude-haiku-4.5",
        messages: appendedInstructions,
        stopWhen: stepCountIs(10),
        tools: componentTools,
        system: `
        You are a writer and you write in markdown format. You are writing a markdown block at the appropriate index based on the selected text and prompt,

        abide by the following rules when writing the markdown block:
        <output-rules>
        - use the markdown format to write the document.
        - refrain from using emojis, unless explicitly asked for, or when it is relevant to the content.
        - DO NOT have postambles/preambles like "Sure! Here's the report..." or "I'll update the markdown..." or anything like that, ONLY WRITE THE MARKDOWN.
        - DO NOT have any other text or comments or anything like that, ONLY WRITE THE MARKDOWN CONTENT for the user. 
        - you are to write the markdown block at the appropriate index based on the selected text and prompt
        - when adding new flash cards, mcq, open-ended questions, use the flash-card tool, mcq tool, open-ended tool to create them.
        </output-rules>
        `,
      });
      const runId = randomUUID();
      const config: StreamProcessorConfig = {
        writer,
        runId,
        eventType: "data-artifact-agent-chat-delta",
      };
      let newArtifactMarkdown = "";
      for await (const chunk of fullStream) {
        switch (chunk.type) {
          case "text-delta":
            newArtifactMarkdown += writeTextDelta(config, chunk.text, true);
            break;
          case "tool-call":
            newArtifactMarkdown += writeComponentDelta(
              config,
              chunk as ToolCallChunk,
              true
            );
            break;
        }
      }
      writer.write({
        type: "data-artifact-agent-generate-markdown-block-end",
        data: {
          markdown: newArtifactMarkdown,
          index,
        },
      });
      return `The new artifact markdown is: ${newArtifactMarkdown}, now summarise the changes made to the user`;
    },
  });
}

export { insertMarkdownIntoArtifactTool };