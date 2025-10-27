import { Sandbox } from "@vercel/sandbox";
import {
  FileUIPart,
  UIMessageStreamWriter,
  generateText,
  stepCountIs,
  tool,
} from "ai";
import { randomUUID } from "crypto";
import ms from "ms";
import z from "zod";

type DataAnalysisToolParams = {
  writer: UIMessageStreamWriter;
  files: Pick<FileUIPart, "filename" | "url">[];
};

const dataAnalysisTool = ({ writer, files }: DataAnalysisToolParams) =>
  tool({
    name: "data-analysis",
    description: "Analyze CSV, Excel, or JSON data",
    inputSchema: z.object({
      title: z.string().describe("The title of the data analysis"),
      description: z.string().describe("The description of the data analysis"),
      plan: z.string().describe("The step-by-step plan of the data analysis"),
    }),
    execute: async ({ title, description, plan }, { toolCallId: runId }) => {
      const startDatetime = Date.now();
      writer.write({
        type: "data-chain-of-thought-run-start",
        data: {
          status: "pending",
          type: "agentic-data-analysis",
          id: runId,
          startDatetime,
          steps: {},
        },
      });
      const startSandboxStep = randomUUID();
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "pending",
          type: "text",
          runId,
          stepId: startSandboxStep,
          data: {
            text: "Starting Sandbox...",
          },
        },
      });
      const sandbox = await Sandbox.create({
        runtime: "python3.13",
        timeout: ms("1 minute"),
      });
      writer.write({
        type: "data-chain-of-thought-step-update",
        data: {
          status: "completed",
          type: "text",
          runId,
          stepId: startSandboxStep,
          data: {
            text: "Sandbox created",
          },
        },
      });
      let response = "";
      try {
        // load files
        let filePaths: string[] = [];
        if (files.length > 0) {
          await sandbox.mkDir("data");
          await sandbox.mkDir("results");
          await sandbox.runCommand({ cmd: "pip", args: ["install", "pandas"] });
          // download files
          const downloadFilesStepId = randomUUID();
          writer.write({
            type: "data-chain-of-thought-step-update",
            data: {
              status: "pending",
              type: "text",
              runId,
              stepId: downloadFilesStepId,
              data: { text: "Downloading files..." },
            },
          });
          await Promise.all(
            files.map(({ filename, url }) => {
              const fileDir = `./data/${filename as string}`;
              filePaths.push(fileDir);
              return sandbox.runCommand({
                cmd: "curl",
                args: ["-o", fileDir, url],
              });
            })
          );
          writer.write({
            type: "data-chain-of-thought-step-update",
            data: {
              status: "completed",
              type: "text",
              runId,
              stepId: downloadFilesStepId,
              data: { text: "Files downloaded" },
            },
          });
        }

        await generateText({
          model: "alibaba/qwen3-coder",
          prompt: `
          You are a data analyst, you are given a title, description, a plan and a list of data files.
          
          The data files are in the following directory:
          ${filePaths.join("\n")}

          Follow these rules:
          - use pandas to analyze the data
          - read files only from the ./data/ directory
          - Optionally, write results to the results/ directory
          - ALWAYS use print statements to debug your code, or to review results
          - Use print statements to review data from data analysis from pandas
          

          Possible Approaches:
          - break down each step of the plan into tasks
          - You can start off by only reading the data files and understanding the data
          - Based on the shape, type of data, you can run your analysis based on the shape of the data
          - Write your code in a python file and run it

          Here is the title, description, and plan:
          title: ${title}
          description: ${description}
          plan: ${plan}

          Write code to fulfill the title, description, and plan.
          `,
          providerOptions: {
            openai: {
              parallelToolCalls: false,
            },
          },
          stopWhen: stepCountIs(5),
          tools: {
            runCode: tool({
              name: "run-code",
              description: "Run code in the sandbox",
              inputSchema: z.object({
                type: z
                  .enum(["read-data", "write-code"])
                  .describe("The type of task being performed"),
                task: z.string().describe("The task to perform"),
                code: z.string().describe("Python code to run"),
              }),
              execute: async (
                { task, code },
                { toolCallId: runCodeStepId }
              ) => {
                writer.write({
                  type: "data-chain-of-thought-step-update",
                  data: {
                    status: "pending",
                    type: "code",
                    runId,
                    stepId: runCodeStepId,
                    data: {
                      task,
                      code,
                      output: undefined,
                    },
                  },
                });
                const runPython = await sandbox.runCommand({
                  cmd: "python",
                  args: ["-c", code],
                  // stderr: process.stderr,
                  // stdout: process.stdout,
                });
                const output = await runPython.output();

                response += `
                Task: ${task}
                Output: ${output}
                `;
                writer.write({
                  type: "data-chain-of-thought-step-update",
                  data: {
                    status: "completed",
                    type: "code",
                    runId,
                    stepId: runCodeStepId,
                    data: { task, code, output },
                  },
                });
                return output;
              },
            }),
          },
        });
        // end sandbox
      } finally {
        await sandbox.stop();
      }
      writer.write({
        type: "data-chain-of-thought-run-end",
        data: {
          status: "completed",
          type: "agentic-data-analysis",
          id: runId,
          endDatetime: Date.now(),
        },
      });
      return `
      The files analyzed are:
       ${files.map(({ filename, url }) => `[${filename}](${url})`).join("\n")}
      The following is the output of the code for each task:
       ${response}
       Return tabular data in table markdown format.
       Return any other relevant information in markdown format.

      Reuse the files analysed should there be follow up questions.
       `;
    },
  });

export { dataAnalysisTool };
