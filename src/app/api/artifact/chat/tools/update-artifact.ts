import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
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
  updateInstructions: z
    .string()
    .describe(
      "The instructions for the update, remind the artifact agent to keep other content as is"
    ),
});

export function insertMarkdownIntoArtifactTool({
  writer,
  selectedContents,
  messages,
}: {
  writer: UIMessageStreamWriter;
  index?: number | null;
  selectedContents: string;
  messages: UIMessage[];
}) {
  return tool({
    description: "Update the artifact with the new content",
    inputSchema: artifactSchema,
    execute: async ({ index, updateInstructions }) => {
      // use streamText to stream the whole update to the front end to
      // create scrolling text like in cursor
      // the output of this will be the full edited artifact
      // this will then be sent to the front end, where diffs will be compared for approval by the user

      // Add update instructions as a new user message
      const updateMessage: UIMessage = {
        id: randomUUID(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `${updateInstructions}

write a markdown block at the appropriate index based on the selected text and prompt

<selected-text>
${selectedContents}
</selected-text>`,
          },
        ],
      };

      const updatedMessages = [...messages, updateMessage];

      const { fullStream } = streamText({
        model: "anthropic/claude-haiku-4.5",
        messages: await convertToModelMessages(updatedMessages),
        stopWhen: stepCountIs(10),
        tools: componentTools,
        system: `
        You are a writer and you write in markdown format. You are writing a markdown block at the appropriate index based on the selected text and prompt,

        abide by the following rules when writing the markdown block:
        <output-rules>
        - use the markdown format to write the document.
        - DO NOT have preambles like "Sure! Here's the report..." or "I'll update the markdown..." or anything like that, ONLY WRITE THE MARKDOWN.
        - you are to write the markdown block at the appropriate index based on the selected text and prompt
        - when adding new flash cards, mcq, open-ended questions, use the flash-card tool, mcq tool, open-ended tool to create them.
        </output-rules>
        
        <style-rules>
        - when highlighting text, use markdown syntax to highlight the text, but for highlights with colors, format like this: ==text=={color}, where color is the hex code of the color.
        - when adding office documents use the file-attachment format which is :::file-attachment {type="file" url="<file-url>" filename="<file-name>" originalMimeType="<mime-type>"}
        :::
        - generally, use markdown syntax for all text formatting.
        </style-rules>
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
