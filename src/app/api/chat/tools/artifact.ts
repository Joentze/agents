import { createArtifact } from "@/app/actions/artifact-actions";
import {
  ChainOfThoughtRun,
  ComponentStep,
  StepUpdateType,
} from "@/app/types/chain-of-thought";
import { stepCountIs, streamText, tool, UIMessageStreamWriter } from "ai";
import { randomUUID } from "crypto";
import z from "zod";
import {
  formatToolComponent,
  writeTextDelta,
  type StreamProcessorConfig,
  type ToolCallChunk,
} from "@/utils/artifact/stream-processor";
import { componentTools } from "@/utils/artifact/component-tools";

type ArtifactToolParams = {
  chatId: string;
  writer: UIMessageStreamWriter;
};
const artifactTool = ({ chatId, writer }: ArtifactToolParams) =>
  tool({
    name: "artifact",
    description: `
      Use the artifact tool when creating reports or summaries of information, 
      you can use the flash-card tool to create flash cards
      you can use the mcq tool to create mcqs.
      you can use the open-ended tool to create open-ended questions.
      `,
    inputSchema: z.object({
      title: z.string().describe("The title of the artifact"),
      description: z.string().describe("The description of the artifact"),
      plan: z
        .string()
        .describe(
          "a point-by-point of what needs to be written in the artifact, and what sources, assets to include in the artifact"
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
        model: "anthropic/claude-haiku-4.5",
        tools: componentTools,
        stopWhen: stepCountIs(5),
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
      const config: StreamProcessorConfig = {
        writer,
        runId,
        eventType: "data-artifact-delta",
      };

      let content = "";
      for await (const chunk of fullStream) {
        switch (chunk.type) {
          case "text-delta":
            content += chunk.text;
            writeTextDelta(config, chunk.text);
            break;
          case "tool-call":
            const { componentName, content: componentContent } =
              formatToolComponent(chunk as ToolCallChunk);

            writer.write({
              type: "data-artifact-delta",
              id: runId,
              data: {
                delta: componentContent,
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
                  component: componentName as ComponentStep["component"],
                },
              } as StepUpdateType,
            });
            content += componentContent;
            break;
          default:
            break;
        }
      }
      writer.write({
        type: "data-artifact-end",
        id: runId,
        data: {
          title,
          description,
          plan,
          content,
        },
      });
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

      await createArtifact({
        callId: runId,
        title,
        description,
        content,
        chatId,
      });
      return content;
    },
  });
export { artifactTool };
