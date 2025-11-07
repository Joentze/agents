import { RunStepStatus } from "@/app/types/chain-of-thought";
import { Sandbox } from "@vercel/sandbox";
import { UIMessageStreamWriter } from "ai";
import { randomUUID } from "crypto";
import ms from "ms";

type SandboxContext = {
  runId: string;
  type: "python" | "nodejs";
  writer: UIMessageStreamWriter;
  dependencies: string[];
  files: Array<{
    filename: string;
    url: string;
    mediaType?: string | undefined;
  }>;
  env?: Record<string, string>;
};

class SandboxRunner {
  private env: Record<string, string> = {};
  private filePaths: string[] = [];
  private timeout: number = ms("2 minutes") as number;
  private defaultDependencies: string[] = [
    "vercel",
    "vercel-sandbox",
    "python-dotenv",
  ];
  protected context: SandboxContext;
  protected stdVals:
    | { stdout: NodeJS.WriteStream; stderr: NodeJS.WriteStream }
    | {};
  protected sandbox: Sandbox | null = null;
  protected gitTemplateUrl: string =
    "https://github.com/Joentze/vercel-python-sandbox.git";
  constructor(context: SandboxContext, debug: boolean = false) {
    this.context = context;
    this.env = context.env ?? {};
    this.stdVals = debug
      ? { stdout: process.stdout, stderr: process.stderr }
      : {};
  }
  async start() {
    try {
      const { dependencies, files } = this.context;
      // set up sandbox with environment
      this.sandbox = await Sandbox.create({
        runtime: this.context.type === "python" ? "python3.13" : "node22",
        source: {
          type: "git",
          url: this.gitTemplateUrl,
        },
        timeout: this.timeout,
        ...this.stdVals,
      });

      await this.sandbox.mkDir("data");
      await this.sandbox.mkDir("results");
      await this.runStep({
        beforeLabel: "Downloading files",
        afterLabel: "Files downloaded",
        stepFunction: async () => {
          await Promise.all(
            files.map(({ filename, url }) => {
              const fileDir = `./data/${filename as string}`;
              this.filePaths.push(fileDir);
              return this.runCommand({
                cmd: "curl",
                args: ["-o", fileDir, url],
              });
            })
          );
          return "Files downloaded";
        },
      });
      // install dependencies
      await this.runStep({
        beforeLabel: "Installing dependencies",
        afterLabel: "Dependencies installed",
        stepFunction: async () => {
          return await this.runCommand({
            cmd: this.context.type === "python" ? "pip" : "pnpm",
            args: ["install", ...this.defaultDependencies, ...dependencies],
          });
        },
      });
    } catch (error) {
      console.error(error);
      throw new Error(`Error starting sandbox: ${error}`);
    }
  }
  async runCommand({
    cmd,
    args,
    env = {},
  }: {
    cmd: string;
    args: string[];
    env?: Record<string, string>;
  }): Promise<string> {
    if (!this.sandbox) {
      throw new Error("Sandbox not started");
    }
    try {
      const result = await this.sandbox.runCommand({
        cmd,
        args,
        env: { ...this.env, ...env },
        ...this.stdVals,
      });
      return await result.output();
    } catch (error) {
      throw new Error(`Error running command: ${cmd} ${args.join(" ")}`);
    }
  }
  public async runCommandStep({
    cmd,
    args,
    env = {},
    beforeLabel = `Running command: ${cmd} ${args.join(" ")}`,
    afterLabel = `Command completed`,
  }: {
    cmd: string;
    args: string[];
    env?: Record<string, string>;
    beforeLabel?: string;
    afterLabel?: string;
  }): Promise<string> {
    return await this.runStep({
      beforeLabel,
      afterLabel,
      stepFunction: async () => {
        return await this.runCommand({ cmd, args, env });
      },
    });
  }
  public async runStep({
    beforeLabel,
    afterLabel,
    stepFunction,
  }: {
    beforeLabel: string;
    afterLabel: string;
    stepFunction: () => Promise<string>;
  }): Promise<string> {
    const stepId = randomUUID();
    const { runId, writer } = this.context;
    try {
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "pending",
          type: "text",
          runId,
          stepId,
          data: {
            text: beforeLabel,
          },
        },
      });
      const response = await stepFunction();
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "completed",
          type: "text",
          runId,
          stepId,
          data: {
            text: afterLabel,
          },
        },
      });
      return response;
    } catch (error) {
      console.error(error);
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "error",
          type: "text",
          runId,
          stepId,
          data: {
            text: `There was an error running the step`,
          },
        },
      });
      return (error as Error).message;
    }
  }
  public getContext(): SandboxContext {
    return this.context;
  }
  async stop() {
    if (this.sandbox) {
      await this.sandbox.stop();
    }
  }
}

export { SandboxRunner };
