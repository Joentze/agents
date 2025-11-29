import {
  ChainOfThoughtRun,
  StepUpdateType,
} from "@/app/types/chain-of-thought";
import { google, GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";
import { generateText, stepCountIs, tool, UIMessageStreamWriter } from "ai";
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

      const {
        text: searchResponseText,
        sources,
        providerMetadata,
      } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: `You are an advanced researcher, Here's how you work:
        1. You start by using the date tool to get the current date.
        2. You break down the query into relevant topics and use the search
         tool to find the most relevant information. The query is: ${query} with the current date.
        3. You summarise the information and use the text tool to store the information.`,
        stopWhen: stepCountIs(5),
        tools: {
          url_context: google.tools.urlContext({}) as any,
          searchTool: google.tools.googleSearch({}) as any,
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
      });
      const metadata = providerMetadata?.google as
        | GoogleGenerativeAIProviderMetadata
        | undefined;

      const sourceUrls = metadata?.urlContextMetadata?.urlMetadata.map(
        ({ retrievedUrl }) => retrievedUrl
      );
      const sourceStepId = randomUUID();
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "pending",
          type: "search",
          runId,
          stepId: sourceStepId,
          data: {
            query,
            results: sources
              .filter((source) => source.sourceType === "url")
              .map((source) => {
                return {
                  url: (source as any).url,
                  sourceUrl: `https://${(source as any).title}`,
                  title: (source as any).title ?? "",
                  text: "",
                };
              }),
          },
        } as StepUpdateType,
      });

      sources
        .filter((source) => source.sourceType === "url")
        .forEach((source, index) => {
          writer.write({
            sourceId: `source-${index.toString()}`,
            type: "source-url",
            url: `${(source as any).url}`,
            title: (source as any).title ?? "",
          });
        });
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

      (sourceUrls ?? []).forEach((url, index) =>
        writer.write({
          type: "source-url",
          url,
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
          data: { text: searchResponseText },
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
      return `Write a detailed report of the following information:${searchResponseText}`;
    },
  });

export { searchTool, search2Tool };
