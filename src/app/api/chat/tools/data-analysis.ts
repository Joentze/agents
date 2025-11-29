import { Sandbox } from "@e2b/code-interpreter";
import {
  FileUIPart,
  UIMessageStreamWriter,
  generateText,
  stepCountIs,
  tool,
} from "ai";
import { randomUUID } from "crypto";
import z from "zod";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

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

      const sandbox = await (
        await Sandbox.create("code-interpreter-v1", {
          timeoutMs: 2 * 60 * 1000,
        })
      ).connect();
      await sandbox.files.makeDir("data");
      await sandbox.files.makeDir("results");
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

        if (files.length > 0) {
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
            files.map(async ({ filename, url }) => {
              const response = await fetch(url);
              const arrayBuffer = await response.arrayBuffer();
              return sandbox.files.write(`./data/${filename}`, arrayBuffer);
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
          model: "anthropic/claude-4.5-haiku",
          prompt: `
          You are a data analyst, you are given a title, description, a plan and a list of data files.
          
          The data files are in the following directory:
          ${filePaths.join("\n")}

          Follow these rules:
          - use matplotlib to visualize the data
          - read files only from the ./data/ directory, do not read files from anything else unless the user asks you to do so
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
          stopWhen: stepCountIs(5),
          tools: {
            runCode: tool({
              name: "run-code",
              description:
                'When you use this tool, you run code in the sandbox. You will be running the python -c "<code>" command. There are no continuations from previous code blocks ran',
              inputSchema: z.object({
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
                const runPython = await sandbox.runCode(code);
                const uploadedImages = await Promise.all(
                  runPython.results.map(async ({ png, jpeg }, i) => {
                    const imageData = png || jpeg;

                    if (imageData) {
                      return await put(
                        `result-${nanoid(10)}.${i}.${png ? "png" : "jpeg"}`,
                        Buffer.from(imageData, "base64"),
                        {
                          access: "public",
                        }
                      );
                    }
                  })
                );

                const codeResponse = `
                Results: ${runPython.logs.stdout.join("\n")}
                Result images: ${uploadedImages
                  .map((image) => {
                    if (image) {
                      return `![${image.pathname}](${image.url})`;
                    }
                    return "";
                  })
                  .join("\n")}
                `;
                response += `task: ${task}\n\n${codeResponse}`;
                writer.write({
                  type: "data-chain-of-thought-step-update",
                  data: {
                    status: "completed",
                    type: "code",
                    runId,
                    stepId: runCodeStepId,
                    data: { task, code, output: codeResponse },
                  },
                });

                return codeResponse;
              },
            }),
          },
        });

        return `
        The files analyzed are:
         ${files.map(({ filename, url }) => `[${filename}](${url})`).join("\n")}
        The following is the output of the code for each task:
         ${response}
         Return tabular data in table markdown format.
         Return any other relevant information in markdown format.
         Display all images as Github Flavored Markdown images.
         `;
        // end sandbox
      } catch (error) {
        console.error(`Error analyzing data: ${error}`);
        return `Error analyzing data: ${error}`;
      } finally {
        writer.write({
          type: "data-chain-of-thought-run-end",
          data: {
            status: "completed",
            type: "agentic-data-analysis",
            id: runId,
            endDatetime: Date.now(),
          },
        });
        await sandbox.kill();
      }
    },
  });

export { dataAnalysisTool };
