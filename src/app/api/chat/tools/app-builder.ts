import {
  generateText,
  hasToolCall,
  stepCountIs,
  streamText,
  tool,
  UIMessageStreamWriter,
  type UIMessage,
} from "ai";
import { setTimeout } from "timers/promises";
import { appBuilderPrompt as system } from "./app-agent/app-builder-prompt";
import { z } from "zod";
import { runCommand } from "./app-agent/run-command";
import { generateFiles } from "./app-agent/generate-files";
import { AppRunner } from "../classes/app-runner";
import { Sandbox } from "e2b";
import { AppBuilderStatusDataPart } from "@/app/types/app-agent";
import { getSandboxUrl } from "./app-agent/get-sandbox-url";

interface AppBuilderToolParams {
  messages: UIMessage[];
  writer: UIMessageStreamWriter;
}
function appBuilderTool({ messages, writer }: AppBuilderToolParams) {
  return tool({
    name: "app-builder",
    description: "Use this tool when the user asks to build an app",
    inputSchema: z.object({
      details: z.string().describe("The details of the app to build"),
    }),
    execute: async ({ details }, { toolCallId: runId }) => {
      const runner = new AppRunner({ runId, writer });
      try {
        writer.write({
          type: "data-app-builder-status",
          data: {
            status: "started",
            sandboxId: undefined,
          } as AppBuilderStatusDataPart,
          transient: true,
        });
        await runner.start();
        if (!runner.sandbox) {
          throw new Error("Sandbox not started");
        }
        const { sandboxId } = runner.sandbox as Sandbox;
        writer.write({
          type: "data-app-builder-status",
          data: {
            status: "generating",
            sandboxId,
          } as AppBuilderStatusDataPart,
          transient: true,
        });
        await generateText({
          model: "openai/gpt-5-mini",
          system,
          stopWhen: [stepCountIs(20), hasToolCall("get-sandbox-url")],
          prompt: `Generate an app based on the following details: ${details}, get the sandbox URL once the app is built and the dev server is running, try to be straight forward and concise, minimise the number of files, only generate the necessary files`,
          tools: {
            "run-command": runCommand({ runner, writer }),
            "generate-files": generateFiles({ runner, writer, messages }),
            "get-sandbox-url": getSandboxUrl({ runner, writer, sandboxId }),
          },
          providerOptions: {
            openai: {
              include: ["reasoning.encrypted_content"],
              reasoningEffort: "low",
              reasoningSummary: "auto",
            },
          },
        });

        return "App has been built successfully";
        // writer.merge(response.toUIMessageStream({ sendReasoning: true }));
      } catch (error) {
        console.error(error);
        writer.write({
          type: "data-app-builder-status",
          data: {
            status: "error",
            sandboxId: undefined,
            errorMessage: (error as Error).message,
          } as AppBuilderStatusDataPart,
        });
        await runner.stop();
      }
    },
  });
}

export { appBuilderTool };
