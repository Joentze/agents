import { UIMessageStreamWriter } from "ai";
import ms from "ms";
import { randomUUID } from "node:crypto";
import { Sandbox } from "e2b";

type AppRunnerStepType = "command" | "write-file" | "read-file";
type AppRunnerStepParams = {
  type: AppRunnerStepType;
  beforeLabel: string;
  afterLabel: string;
  stepFunction: () => Promise<string>;
};

type AppRunnerDataPart = {
  stepId: string;
  type: AppRunnerStepType;
  status: "pending" | "completed" | "error";
  files?: string[];
  text: string;
};
class AppRunner {
  public runId: string;
  public sandboxId: string | undefined = undefined;
  public sandbox: Sandbox | null = null;
  private timeout: number = ms("5 minutes") as number;
  private writer: UIMessageStreamWriter;
  constructor({
    runId,
    writer,
  }: {
    runId: string;
    writer: UIMessageStreamWriter;
  }) {
    this.runId = runId;
    this.sandbox = null;
    this.sandboxId = undefined;
    this.writer = writer;
  }
  async start() {
    // this.sandbox = await Sandbox.create({
    //   source: {
    //     url: "https://github.com/Joentze/vercel-next-sandbox.git",
    //     type: "git",
    //   },
    //   runtime: "node22",
    //   timeout: this.timeout,
    //   ports: [3000],
    // });
    // const template = Template()
    //   .fromBunImage("1.3")
    //   .setWorkdir("/home/user/nextjs-app")
    //   .runCmd(
    //     "bun create next-app --app --ts --tailwind --turbopack --yes --use-bun ."
    //   )
    //   .runCmd("bunx --bun shadcn@latest init -d")
    //   .runCmd("bunx --bun shadcn@latest add --all")
    //   .runCmd(
    //     "mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app"
    //   )
    //   .setWorkdir("/home/user")
    //   .setStartCmd(
    //     "bun --bun run dev --turbo",
    //     waitForURL("http://localhost:3000")
    //   );
    // await Template.build(template, {
    //   alias: "nextjs-shadcn-app",
    //   cpuCount: 2, // CPU cores
    //   memoryMB: 2048,
    // });
    this.sandbox = await (
      await Sandbox.create("nextjs-app-shadcn-bun", {
        timeoutMs: 5 * 60 * 1000,
      })
    ).connect();
    this.sandboxId = this.sandbox?.sandboxId;
  }
  getSandboxId() {
    if (!this.sandbox) {
      throw new Error("Sandbox not started");
    }
    return this.sandboxId;
  }
  async runStep({
    type,
    beforeLabel,
    afterLabel,
    stepFunction,
  }: AppRunnerStepParams): Promise<string> {
    try {
      const stepId = randomUUID();
      this.writer.write({
        id: this.runId,
        type: "data-app-builder-step-update",
        data: {
          stepId,
          type,
          status: "pending",
          text: beforeLabel,
        } as AppRunnerDataPart,
      });
      const output = await stepFunction();
      this.writer.write({
        id: this.runId,
        type: "data-app-builder-step-update",
        data: {
          stepId,
          type,
          status: "completed",
          text: afterLabel,
        } as AppRunnerDataPart,
      });
      return output;
    } catch (error) {
      console.error(error);
      return (error as Error).message;
    }
  }
  async stop() {
    if (this.sandbox) {
      await this.sandbox.kill();
    }
  }
}

export { AppRunner };
