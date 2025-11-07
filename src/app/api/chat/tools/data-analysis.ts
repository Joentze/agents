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
    description:
      "Analyze CSV, Excel, JSON data, create visualizations (pie charts, bar charts, line charts, etc.), and write code to analyze the data, if the user needs to create jupyter notebook/ipynb files use this tool to create the file",
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
        source: {
          type: "git",
          url: "https://github.com/Joentze/vercel-python-sandbox.git",
        },
        runtime: "python3.13",
        timeout: ms("2 minutes"),
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
        const filePaths: string[] = [];
        await sandbox.runCommand({
          cmd: "pip",
          args: ["install", "-r", "requirements.txt"],
          stdout: process.stdout,
          stderr: process.stderr,
        });
        if (files.length > 0) {
          await sandbox.mkDir("data");
          await sandbox.mkDir("results");

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
          - use seaborn/matplotlib to visualize the data
          - when you use seaborn/matplotlib, ONLY save the plots as images in the results/ directory
          - read files only from the ./data/ directory
          - Optionally, write results to the results/ directory
          - ALWAYS use print statements to debug your code, or to review results
          - Use print statements to review data from data analysis from pandas
          - If the user needs to create ipynb files, use the nbformat library to create the file into the results/ directory.
          

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
          stopWhen: stepCountIs(10),
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
        const uploadResultFiles = await sandbox.runCommand({
          cmd: "python",
          args: ["-m", "upload_result_files"],
          env: {
            BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN as string,
            BLOB_READ_WRITE_URL: process.env.BLOB_READ_WRITE_URL as string,
          },
          stdout: process.stdout,
          stderr: process.stderr,
        });
        writer.write({
          type: "data-chain-of-thought-run-end",
          data: {
            status: "completed",
            type: "agentic-data-analysis",
            id: runId,
            endDatetime: Date.now(),
          },
        });
        const uploadedFiles = await uploadResultFiles.output();

        return `
        The files analyzed are:
         ${files.map(({ filename, url }) => `[${filename}](${url})`).join("\n")}
        The following is the output of the code for each task:
         ${response}
         Return tabular data in table markdown format.
         Return any other relevant information in markdown format.
  
        Reuse the files analysed should there be follow up questions.
  
        If there are any result files, Follow these rules:
        - If the file is an image, return the image in GFM image markdown format.
        - ELSE return the file as a hyperlink and urge user to download the file from the following URL

        The result files are:
        ${uploadedFiles}
        
         `;
        // end sandbox
      } finally {
        await sandbox.stop();
      }
    },
  });

export { dataAnalysisTool };
