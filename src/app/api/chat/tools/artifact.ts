import {
  ChainOfThoughtRun,
  ComponentStep,
  StepUpdateType,
} from "@/app/types/chain-of-thought";
import {
  smoothStream,
  stepCountIs,
  streamText,
  tool,
  UIMessageStreamWriter,
} from "ai";
import { randomUUID } from "crypto";
import z from "zod";

type ArtifactToolParams = {
  writer: UIMessageStreamWriter;
};

const flashCardTool = tool({
  name: "flash-card",
  description: "Use the flash-card tool when creating flash cards",
  inputSchema: z.object({
    title: z.string().describe("The title of the flash cards"),
    cards: z
      .array(
        z.object({
          question: z.string().describe("The question of the flash card"),
          answer: z.string().describe("The answer of the flash card"),
        })
      )
      .describe("The cards of the flash card"),
  }),
  execute: async ({ cards }) => {
    return cards.map((card) => {
      return {
        question: card.question,
        answer: card.answer,
      };
    });
  },
});

const artifactTool = ({ writer }: ArtifactToolParams) =>
  tool({
    name: "artifact",
    description: `
      Use the artifact tool when creating reports or summaries of information, 
      you can use the flash-card tool to create flash cards.`,
    inputSchema: z.object({
      title: z.string().describe("The title of the artifact"),
      description: z.string().describe("The description of the artifact"),
      plan: z
        .string()
        .describe(
          "a point-by-point of what needs to be written in the artifact"
        ),
    }),

    execute: async ({ title, description, plan }, { toolCallId: runId }) => {
      writer.write({
        type: "data-artifact-start",
        id: runId,
        data: {
          title,
          description,
          plan,
        },
      });
      const startDatetime = Date.now();
      writer.write({
        type: "data-chain-of-thought-run-start",
        data: {
          status: "pending",
          type: "agentic-artifact",
          id: runId,
          startDatetime,
          steps: {},
        } as ChainOfThoughtRun,
      });
      const textUuid = randomUUID();
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "pending",
          type: "writing",
          runId,
          stepId: textUuid,
          data: {
            content: `Writing artifact titled: '${title}'`,
          },
          startDatetime,
        } as StepUpdateType,
      });

      const { fullStream } = streamText({
        model: "openai/gpt-4.1-nano",
        tools: {
          flashCardTool,
        },
        stopWhen: stepCountIs(3),
        prompt: `
            You are a writer and you write a detailed report based on the following:
            title: ${title}
            description: ${description}
            plan: ${plan}

            Follow these rules:
            - use the markdown format to write the document.
            - write the document following the plan and the description. 
            - DO NOT have preambles like "Sure! Here's the report..." or anything like that, go straight to the content.
            - If you need to create flash cards, use the flash-card tool to create them.
            `,
      });
      let content = "";
      for await (const chunk of fullStream) {
        switch (chunk.type) {
          case "text-delta":
            content += chunk.text;
            writer.write({
              type: "data-artifact-delta",
              id: runId,
              data: {
                delta: chunk.text,
              },
            });
            break;
          case "tool-call":
            const component = `:::callout {type="${
              chunk.toolName
            }" content="${Buffer.from(JSON.stringify(chunk.input)).toString(
              "base64"
            )}"}

${JSON.stringify(chunk.input)}

:::`;
            writer.write({
              type: "data-artifact-delta",
              id: runId,
              data: {
                delta: component,
              },
            });
            writer.write({
              type: "data-chain-of-thought-step-update",
              data: {
                status: "completed",
                type: "component",
                runId,
                stepId: runId,
                data: {
                  component: "flash-card" as ComponentStep["component"],
                },
              } as StepUpdateType,
            });
            content += component;
            break;
          default:
            break;
        }
      }
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "completed",
          type: "writing",
          runId,
          stepId: textUuid,
          data: {
            content: `Wrote artifact titled: '${title}'`,
          },
        } as StepUpdateType,
      });
      writer.write({
        type: "data-chain-of-thought-run-end",
        data: {
          status: "completed",
          type: "agentic-artifact",
          id: runId,
          endDatetime: Date.now(),
        } as ChainOfThoughtRun,
      });

      return content;
    },
  });
export { artifactTool };
