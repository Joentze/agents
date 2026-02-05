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
import { ArtifactWriterAgent } from "@/app/agent/artifact-writer-agent";

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
    description: "Write the markdown block at the appropriate index based on the selected text and prompt, before using this tool, read the artifact using the readArtifact tool, if necessary also use the readNodeInArtifact tool to find an appropriate index to insert the markdown block at",
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
      const { fullStream } = await ArtifactWriterAgent.stream({ messages: appendedInstructions })
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