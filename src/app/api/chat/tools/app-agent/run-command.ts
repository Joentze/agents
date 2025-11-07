import { z } from "zod";
import { tool } from "ai";
import { AppRunner } from "../../classes/app-runner";

interface RunCommandParams {
  runner: AppRunner;
}

function runCommand({ runner }: RunCommandParams) {
  return tool({
    name: "run-command",
    description: "Run a command in the sandbox",
    inputSchema: z.object({
      command: z.string().describe("The command to run"),
      args: z.array(z.string()).describe("The arguments to the command"),
      wait: z
        .boolean()
        .describe("Whether to wait for the command to finish")
        .default(true),
    }),
    execute: async ({ command, args, wait }) => {
      try {
        const sandbox = runner.sandbox;
        if (!sandbox) {
          throw new Error("Sandbox not started");
        }
        console.log(
          `Running command ${command} ${args.join(" ")} Wait: ${wait}`
        );
        const cmdResult = await sandbox.runCommand({
          detached: wait ? false : true,
          cmd: command,
          args,
        });

        const [stdout, stderr] = await Promise.all([
          cmdResult.stdout(),
          cmdResult.stderr(),
        ]);
        const output = `The output for command ${command} ${args.join(
          " "
        )} is: stdout: ${stdout}\nstderr: ${stderr}`;
        // console.log(output);
        return output;
      } catch (error) {
        console.error(error);
        return `Error running command ${command} ${args.join(" ")}: ${error}`;
      }
    },
  });
}

export { runCommand };
