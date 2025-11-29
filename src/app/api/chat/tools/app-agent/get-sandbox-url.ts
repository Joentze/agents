import { tool, UIMessageStreamWriter } from "ai";
import { AppRunner } from "../../classes/app-runner";
import { z } from "zod";
import { AppBuilderStatusDataPart } from "@/app/types/app-agent";
import { Sandbox } from "@vercel/sandbox";
import { setTimeout } from "timers/promises";

function getSandboxUrl({
  writer,
  runner,
}: {
  writer: UIMessageStreamWriter;
  runner: AppRunner;
  sandboxId: string;
}) {
  return tool({
    name: "get-sandbox-url",
    description:
      "Use this tool once the command `bun --bun run dev --turbo` has been run and the sandbox is running. Get the URL of the sandbox",
    inputSchema: z.object({
      port: z.number().describe("The port of the sandbox").default(3000),
    }),
    execute: async ({ port }) => {
      try {
        console.log(`Getting sandbox URL for port: ${port}`);
        if (!runner.sandbox) {
          console.error("Sandbox not started");
          throw new Error("Sandbox not started");
        }
        await setTimeout(500);
        const sandboxId = runner.getSandboxId() as string;
        const host = runner.sandbox.getHost(3000);
        const previewUrl = `https://${host}`;
        writer.write({
          type: "data-app-builder-status",
          data: {
            status: "completed",
            sandboxId,
            previewUrl,
          } as AppBuilderStatusDataPart,
        });
        console.log(`Preview URL: ${previewUrl}`);
        return `The preview URL of the sandbox is: ${previewUrl}`;
      } catch (error) {
        console.error(error);
        return `Error getting sandbox URL: ${error}`;
      }
    },
  });
}
export { getSandboxUrl };
