import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  FileUIPart,
} from "ai";
import { search2Tool as agenticSearch } from "@/app/api/chat/tools/search";
import { artifactTool } from "./tools/artifact";
import { dataAnalysisTool } from "./tools/data-analysis";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model: string } =
    await req.json();
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
  const stream = createUIMessageStream({
    async execute({ writer }) {
      // Merge another stream from streamText
      const result = streamText({
        model,
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(10),
        system: `You are a helpful assistant. Follow these instructions:
        - Use the agentic search tool to find information.
        - Use the agentic artifact tool to create a artifact/document/report/flash cards, best used of display information in a structured way.
        - Use the agentic data analysis tool to analyze the data, use this when you need to analyze csv data.

        ${nudge}
        `,
        tools: {
          agenticSearch: agenticSearch({ writer }),
          agenticArtifact: artifactTool({ writer }),
          agenticDataAnalysis: dataAnalysisTool({
            writer,
            files: tabularData.map((file: FileUIPart) => ({
              filename: file.filename,
              url: file.url,
            })),
          }),
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
