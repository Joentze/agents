import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
  zodSchema,
} from "ai";
import { search2Tool as agenticSearch } from "@/app/api/chat/tools/search";

import { z } from "zod";
import { insertMarkdownIntoArtifactTool } from "./tools/insert-artifact";

interface ArtifactChatRequest {
  artifactId: string;
  messages: UIMessage[];
  artifactMarkdown: string;
}

export async function POST(req: Request) {
  const { messages }: ArtifactChatRequest =
    await req.json();

  // Safely extract selectedContents from the last message metadata
  const lastMessageMetadata = messages.slice(-1)[0]?.metadata as
    | { selectedContents?: { content: string; id: string }[] }
    | undefined;
  const selectedContentsArray = lastMessageMetadata?.selectedContents || [];
  const selectedContents = selectedContentsArray
    .map(({ content }: { content: string }) => content)
    .join("\n\n");

  // Append selected content to the last user message if it exists
  const modifiedMessages = [...messages];
  if (selectedContents && modifiedMessages.length > 0) {
    const lastMessage = modifiedMessages[modifiedMessages.length - 1];
    if (lastMessage.role === "user" && lastMessage.parts) {
      // Add a new text part with the selected content
      modifiedMessages[modifiedMessages.length - 1] = {
        ...lastMessage,
        parts: [
          ...lastMessage.parts,
          {
            type: "text" as const,
            text: `\n\n<selected-content>\n${selectedContents}\n</selected-content>`,
          },
        ],
      };
    }
  }

  const stream = createUIMessageStream({
    async execute({ writer }) {
      // Merge another stream from streamText
      const messages = await convertToModelMessages(modifiedMessages);
      const result = streamText({
        model: "anthropic/claude-haiku-4.5",
        messages,
        stopWhen: stepCountIs(20),
        system: `
        You are an artifact manager agent, you help the user edit artifacts and also aid in research for content. 

        Follow these guidelines when helping the user:

        <update-content-guidelines>
        - when the user wants to update specific content you should first use readArtifact, to get the index of the content you want to update.
        - then use readNodeInArtifact to read the specific content you want to update.
        - based on the full markdown of the node, you should update the node with the new content using the updateNodeInArtifact tool.
        - quote the exact markdown of the node in the updateNodeInArtifact tool, do not make up any content, and only update the specific content of the node.
        - in cases where the user selects portions of the next, create markdown that will be relevant to what the user selects
        - when the user selects a portion of the block and asks to translate, for example, only translate the selected portion of the block, do not translate the entire block.
        </update-content-guidelines>
        <insert-content-guidelines></insert-content-guidelines>

        When helping the user help read the artifact using the readArtifact tool and then use the updateArtifact tool to edit the artifact.
        make the necessary updates using the updateArtifact tool.
        give specific instructions on what to update, do not create flash cards, mcqs, open-ended questions, or other custom components, unless the user specifically asks for them.

        the update tool works by rewriting the entire artifact, so you must be specific about what to update, leaving other contents as is.

        when the user needs to search for content, use the agenticSearch tool to search for content.
        `,
        tools: {
          /* read blocks
           * insert block
           * replace block
           * delete block
           */
          readArtifact: {
            description:
              `Reads all markdown blocks in the artifact, this returns the entire list 
              of markdown blocks in the artifact with their indexes, these blocks are 
              previewed, if the user needs to update a specific block, use the 
              readNodeInArtifact tool to read the specific block after getting the index using this tool`,
            inputSchema: z.object({}),
          },
          readNodeInArtifact: {
            description: "Read a specific node in the artifact, this returns the markdown of the node and its index",
            inputSchema: z.object({
              index: z.number().describe("The index of the node to read"),
            }),
          },
          insertIntoArtifact: insertMarkdownIntoArtifactTool({ writer, messages }),
          // updateNodeInArtifact: updateNodeInArtifactTool({ writer, messages }),
          // deleteNodeFromArtifact: deleteNodeFromArtifactTool({ writer, messages }),
          agenticSearch: agenticSearch({ writer }),
        },
        onFinish: async ({ }) => {
          // if first message
        },
      });

      writer.merge(
        result.toUIMessageStream({
          sendSources: true,
          sendReasoning: true,
          originalMessages: modifiedMessages, // Pass original messages to fix duplicate tool call issue
        })
      );
    },

    onFinish: async ({ messages: completedMessages }) => { },
  });
  return createUIMessageStreamResponse({ stream });
}
