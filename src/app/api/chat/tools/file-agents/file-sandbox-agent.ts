import { SandboxRunner } from "../../classes/sandbox-runner";

type RunParams = {
  plan: string;
  details: string;
  filename: string;
};

type FileSandboxAgentParams = {
  sandboxRunner: SandboxRunner;
  model?: string;
};
abstract class FileSandboxAgent {
  protected sandboxRunner: SandboxRunner;
  public model: string;
  constructor({
    sandboxRunner,
    model = "openai/gpt-5-nano",
  }: FileSandboxAgentParams) {
    this.sandboxRunner = sandboxRunner;
    this.model = model;
  }
  abstract run({ plan, details, filename }: RunParams): Promise<string>;
  async getResultFiles(): Promise<string> {
    const { type } = this.sandboxRunner.getContext();
    if (type === "python") {
      return await this.sandboxRunner.runCommand({
        cmd: "python",
        args: ["-m", "upload_result_files"],
        env: {
          BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN as string,
        },
      });
    }
    throw new Error("File upload is not supported for this sandbox type");
  }
}

export { FileSandboxAgent, type FileSandboxAgentParams, type RunParams };
