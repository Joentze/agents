import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  FileUIPart,
  generateObject,
  tool,
  jsonSchema,
  Tool,
} from "ai";
import { search2Tool as agenticSearch } from "@/app/api/chat/tools/search";
import { artifactTool } from "./tools/artifact";
import { dataAnalysisTool } from "./tools/data-analysis";
import { appBuilderTool } from "./tools/app-builder";
import { McpTool } from "@/stores/use-mcps";
import { z } from "zod";
import { createChat, updateChat } from "@/app/actions/chat-actions";
import { createMessage } from "@/app/actions/message-actions";
import { Database, Json } from "@/app/types/database.types";
import { googleMapSearch } from "./tools/search/google-map-search";
import { displayMapTool } from "./tools/search/display-map-tool";

// Allow streaming responses up to 30 seconds
export const maxDuration = 120;

export async function POST(req: Request) {
  const {
    userLocation,
    chatId,
    messages,
    model,
    mcpTools,
  }: {
    userLocation: {
      latitude: number;
      longitude: number;
    } | null;
    chatId: string;
    messages: UIMessage[];
    model: string;
    mcpTools: McpTool[];
  } = await req.json();
  const tabularData: FileUIPart[] = messages.reduce<FileUIPart[]>(
    (acc, { metadata }) => {
      if (metadata) {
        return [
          ...(acc || []),
          ...((metadata as { tabularFiles: FileUIPart[] }).tabularFiles || []),
        ];
      }
      return acc;
    },
    []
  );

  const nudge =
    tabularData.length > 0
      ? `Tabular data has been provided. File(s): ${tabularData
          .map((file: FileUIPart) => `[${file.filename}](${file.url})`)
          .join(", ")}. Use the agentic data analysis tool to analyze the data.`
      : "";

  const mcps = mcpTools.reduce((acc, { name, description, inputSchema }) => {
    acc[name] = tool({
      type: "dynamic",
      description,
      inputSchema: jsonSchema(inputSchema) as any,
    });
    return acc;
  }, {} as Record<string, Tool>);

  const stream = createUIMessageStream({
    async execute({ writer }) {
      // create title
      if (messages.length === 1) {
        generateObject({
          model: "openai/gpt-5-nano",
          schema: z.object({
            title: z.string(),
          }),
          system: `Generate a simple title for the chat based on the conversation history`,
          messages: convertToModelMessages(messages),
        }).then(async ({ object: { title } }) => {
          await updateChat(chatId, { name: title });
        });
      }
      // Merge another stream from streamText
      const result = streamText({
        model: "anthropic/claude-haiku-4.5",
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(10),
        system: `You are a helpful assistant. Follow these instructions:
        - Use the agentic search tool to find information.
        - Use the agentic artifact tool to create a artifact/document/report/flash cards, best used of display information in a structured way.
        - Use the agentic data analysis tool to analyze the data, use this when you need to analyze csv data.
        - Use the agentic file creator tool to create a file, use this when you need to create a .ipynb, .pdf, .md, .pptx, .xlsx, .csv file.
        - Use the app builder tool to build an app
        ${nudge}
        `,
        tools: {
          agenticSearch: agenticSearch({ writer }),
          agenticArtifact: artifactTool({ chatId, writer }),
          agenticMapSearch: googleMapSearch({ writer, userLocation }),
          agenticDataAnalysis: dataAnalysisTool({
            writer,
            files: tabularData.map((file: FileUIPart) => ({
              filename: file.filename,
              url: file.url,
            })),
          }),
          // agenticFileCreator: fileCreatorTool({ writer }),
          // generateFiles: generateFiles({
          //   runner: new AppRunner({ runId: "xxx", writer }),
          //   writer,
          //   messages,
          // }),
          appBuilder: appBuilderTool({ writer, messages }),
          displayMap: displayMapTool({ writer }),
          ...mcps,
        },
        providerOptions: {
          openai: {
            parallelToolCalls: false,
            reasoningSummary: "auto",
            reasoningEffort: "low",
          },
        },
        onFinish: async ({}) => {
          // if first message
        },
      });

      writer.merge(
        result.toUIMessageStream({ sendSources: true, sendReasoning: true })
      );
    },

    onFinish: async ({ messages: completedMessages }) => {
      const [user, assistant] = [...messages, ...completedMessages]
        .slice(-2)
        .map(({ role, parts, metadata }) => {
          return {
            chatId,
            role,
            parts,
            metadata: metadata ?? ({} as unknown as Json),
            attachments: [],
          };
        });
      // save message to db
      createMessage(
        chatId as string,
        [user, assistant] as Database["public"]["Tables"]["message"]["Insert"][]
      );
    },
  });
  return createUIMessageStreamResponse({ stream });
}
