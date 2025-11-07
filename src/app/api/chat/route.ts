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
import { fileCreatorTool } from "./tools/file-creator";
import { generateFiles } from "./tools/app-agent/generate-files";
import { AppRunner } from "./classes/app-runner";
import { appBuilderTool } from "./tools/app-builder";

// Allow streaming responses up to 30 seconds
export const maxDuration = 120;

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
        - Use the agentic file creator tool to create a file, use this when you need to create a .ipynb, .pdf, .md, .pptx, .xlsx, .csv file.
        - Use the app builder tool to build an app
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
          agenticFileCreator: fileCreatorTool({ writer }),
          generateFiles: generateFiles({
            runner: new AppRunner({ runId: "xxx", writer }),
            writer,
            messages,
          }),
          appBuilder: appBuilderTool({ writer, messages }),
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
