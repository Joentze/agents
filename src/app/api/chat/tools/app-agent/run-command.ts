import { z } from "zod";
import { tool, UIMessageStreamWriter } from "ai";
import { AppRunner } from "../../classes/app-runner";

interface RunCommandParams {
  runner: AppRunner;
  writer: UIMessageStreamWriter;
}

function runCommand({ runner, writer }: RunCommandParams) {
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
        const cmd = command + " " + args.join(" ");
        writer.write({
          type: "data-app-builder-logs",
          data: {
            level: "log",
            message: cmd,
            timestamp: new Date().toISOString(),
          },
        });
        let stdouts = "";
        let stderrs = "";
        const cmdResult = await sandbox.commands.run(cmd, {
          background: !wait,
          onStdout: (stdout) => {
            stdouts += stdout;
          },
          onStderr: (stderr) => {
            stderrs += stderr;
          },
        });
        console.log(`stdout: ${stdouts}`);
        console.log(`stderr: ${stderrs}`);
        writer.write({
          type: "data-app-builder-logs",
          data: {
            level: "log",
            message: cmdResult.stdout,
            timestamp: new Date().toISOString(),
          },
        });
        if (cmdResult.stdout) {
          writer.write({
            type: "data-app-builder-logs",
            data: {
              level: "log",
              message: cmdResult.stdout,
              timestamp: new Date().toISOString(),
            },
          });
        }
        if (cmdResult.stderr) {
          writer.write({
            type: "data-app-builder-logs",
            data: {
              logLevel: "error",
              message: cmdResult.stderr,
              timestamp: new Date().toISOString(),
            },
          });
        }
        return `
        stdout:
        ${cmdResult.stdout}
        stderr:
        ${cmdResult.stderr}
        `;
      } catch (error) {
        console.error(error);
        return `Error running command ${command} ${args.join(" ")}: ${error}`;
      }
    },
  });
}

export { runCommand };
