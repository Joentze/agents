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

interface ArtifactChatRequest {
  artifactId: string;
  messages: UIMessage[];
  artifactMarkdown: string;
}

export async function POST(req: Request) {
  const { artifactId, messages, artifactMarkdown }: ArtifactChatRequest =
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
              "Read the artifact, this returns the entire list of blocks in the artifact with their indexes",
            inputSchema: z.object({}),
          },
          insertArtifact: {
            description:
              "Insert markdown at the specified index",
            inputSchema: z.object({
              index: z.number(),
              markdown: z.string(),
            }),
          },
          agenticSearch: agenticSearch({ writer }),
        },
        onFinish: async ({}) => {
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

    onFinish: async ({ messages: completedMessages }) => {},
  });
  return createUIMessageStreamResponse({ stream });
}
