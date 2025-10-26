import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
} from "ai";
import {
  searchTool as search,
  search2Tool as agenticSearch,
} from "@/app/api/chat/tools/search";
import { artifactTool } from "./tools/artifact";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model: string } =
    await req.json();

  const stream = createUIMessageStream({
    async execute({ writer }) {
      // Merge another stream from streamText
      const result = streamText({
        model,
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(10),
        system:
          "You are a helpful assistant that can use the search tool to find information. Use agentic search once",
        tools: {
          agenticSearch: agenticSearch({ writer }),
          agenticArtifact: artifactTool({ writer }),
        },
        providerOptions: {
          openai: {
            parallelToolCalls: false,
          },
        },
      });

      writer.merge(result.toUIMessageStream());
    },
    onFinish: ({ messages }) => {
      //   console.log("Stream finished with messages:", messages);
    },
  });
  return createUIMessageStreamResponse({ stream });
}
