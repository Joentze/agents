import {
  ChainOfThoughtRun,
  StepUpdateType,
} from "@/app/types/chain-of-thought";
import {
  generateObject,
  stepCountIs,
  streamText,
  tool,
  UIMessageStreamWriter,
} from "ai";
import { randomUUID } from "crypto";
import Exa from "exa-js";
import { z } from "zod";

const searchTool = tool({
  name: "search",
  description:
    "Search the web for information, for more complex queries, increase the number of results",
  inputSchema: z.object({
    query: z.string(),
    numResults: z.number().optional().default(5),
  }),
  execute: async ({ query, numResults }) => {
    const exa = new Exa();
    const { results } = await exa.searchAndContents(query, {
      text: true,
      numResults,
    });
    return results.map(({ url, title, text }) => {
      return {
        url,
        title,
        text,
      };
    });
  },
});

const search2Tool = ({ writer }: { writer: UIMessageStreamWriter }) =>
  tool({
    name: "search",
    description: "Search the web for information",
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }, { toolCallId: runId }) => {
      const startDatetime = Date.now();
      writer.write({
        type: "data-chain-of-thought-run-start",
        data: {
          status: "pending",
          type: "agentic-search",
          id: runId,
          startDatetime,
          steps: {},
        } as ChainOfThoughtRun,
      });
     
      const { fullStream } = streamText({
        model: "openai/gpt-4.1-nano",
        prompt: `You are an advanced researcher, Here's how you work:
        1. You start by using the date tool to get the current date.
        2. You break down the query into relevant topics and use the search
         tool to find the most relevant information. The query is: ${query} with the current date.
        3. You summarise the information and use the text tool to store the information.`,
        stopWhen: stepCountIs(5),
        tools: {
          searchTool,
          dateTool: tool({
            name: "date",
            description: "Get the current date",
            inputSchema: z.object({}),
            execute: async () => {
              return new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            },
          }),
        },
        providerOptions: {
          openai: {
            parallelToolCalls: false,
          },
        },
      });

      let sources: { url: string; title: string; text: string }[] = [];
      for await (const chunk of fullStream) {
        switch (chunk.type) {
          case "tool-call":
            if (chunk.toolName === "searchTool") {
              writer.write({
                type: "data-chain-of-thought-step-update",
                data: {
                  status: "pending",
                  type: "search",
                  runId,
                  stepId: chunk.toolCallId,
                  data: {
                    query: (chunk.input as { query: string })?.query || "",
                    results: [],
                  },
                } as StepUpdateType,
              });
            }

            break;
          case "tool-result":
            if (chunk.toolName === "searchTool") {
              sources.push(
                ...(chunk.output as {
                  url: string;
                  title: string;
                  text: string;
                }[])
              );
              writer.write({
                type: "data-chain-of-thought-step-update",
                data: {
                  status: "completed",
                  type: "search",
                  runId,
                  stepId: chunk.toolCallId,
                  data: {
                    query: (chunk.input as { query: string })?.query || "",
                    results: chunk.output as {
                      url: string;
                      title: string;
                      text: string;
                    }[],
                  },
                } as StepUpdateType,
              });
            }
            if (chunk.toolName === "dateTool") {
              writer.write({
                type: "data-chain-of-thought-step-update",
                data: {
                  status: "completed",
                  type: "date",
                  runId,
                  stepId: chunk.toolCallId,
                  data: {
                    date: chunk.output,
                  },
                } as StepUpdateType,
              });
            }
            break;
          default:
            break;
        }
      }
      const summaryId = randomUUID();
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "pending",
          type: "text",
          runId,
          stepId: summaryId,
          data: { text: "" },
        } as StepUpdateType,
      });
      const {
        object: { text, relevantSources },
      } = await generateObject({
        model: "openai/gpt-4.1-nano",
        temperature: 0,
        schema: z.object({
          text: z.string(),
          relevantSources: z
            .array(z.string())
            .describe("The sources that are relevant to the information"),
        }),
        prompt: `You read vast amounts of information and give a detailed report of the following information in point form
remember to include the source of the information in the report. Like this:
        Content: ${JSON.stringify(sources)}
        return in plain text, no markdown, no html, no json, no code, no anything else.
        `,
      });
      relevantSources.forEach((source, index) =>
        writer.write({
          type: "source-url",
          url: source,
          sourceId: `source-${index.toString()}`,
        })
      );
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "completed",
          type: "text",
          runId,
          stepId: summaryId,
          data: { text },
        } as StepUpdateType,
      });
      writer.write({
        type: "data-chain-of-thought-run-end",
        data: {
          status: "completed",
          id: runId,
          endDatetime: Date.now(),
        },
      });
      return `Write a detailed report of the following information:${text}`;
    },
  });

export { searchTool, search2Tool };
