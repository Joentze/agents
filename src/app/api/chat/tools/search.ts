import { stepCountIs, streamText, tool, UIMessageStreamWriter } from "ai";
import Exa from "exa-js";
import { z } from "zod";

const searchTool = tool({
  name: "search",
  description: "Search the web for information",
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
    execute: async ({ query }, { toolCallId: id }) => {
      const { fullStream } = streamText({
        model: "openai/gpt-4.1-nano",
        prompt: `You are an advanced researcher, you break down the query into relevanttopics and use the search
         tool to find the most relevant information. The query is: ${query}`,
        toolChoice: "required",
        stopWhen: stepCountIs(3),
        tools: {
          searchTool,
        },
        providerOptions: {
          openai: {
            parallelToolCalls: false,
          },
        },
      });
      let results = [];
      for await (const chunk of fullStream) {
        switch (chunk.type) {
          case "tool-call":
            console.log((chunk.input as { query: string })?.query);
            writer.write({
              type: "data-search-call",
              data: {
                id,
                query: (chunk.input as { query: string })?.query || "",
              },
            });
            break;
          case "tool-result":
            writer.write({
              type: "data-search-result",
              data: {
                id,
                results: (
                  chunk.output as { url: string; title: string; text: string }[]
                ).map(({ url, title }) => {
                  return {
                    url,
                    title,
                  };
                }),
              },
            });
            results.push(chunk.output);
            break;
          default:
            break;
        }
      }
      return results;
    },
  });

export { searchTool, search2Tool };
