import { tool, UIMessageStreamWriter } from "ai";
import z from "zod";
import { MarkdownAgent } from "./file-agents/markdown";
import { PDFAgent } from "./file-agents/pdf";
import { PowerpointAgent } from "./file-agents/powerpoint";
import { PyNotebookAgent } from "./file-agents/py-notebook";
import { CSVAgent } from "./file-agents/csv";
import { XLSXAgent } from "./file-agents/xlsx";
import { SandboxRunner } from "../classes/sandbox-runner";
import {
  FileSandboxAgent,
  FileSandboxAgentParams,
} from "./file-agents/file-sandbox-agent";

type AgentConstructor = new (
  params: FileSandboxAgentParams
) => FileSandboxAgent;

const fileAgents: Partial<Record<fileTypeEnum, AgentConstructor>> = {
  pdf: PDFAgent,
  md: MarkdownAgent,
  pptx: PowerpointAgent,
  ipynb: PyNotebookAgent,
  csv: CSVAgent,
  xlsx: XLSXAgent,
};

type FileManagerToolParams = {
  writer: UIMessageStreamWriter;
};
const fileTypes = z
  .enum(["ipynb", "pdf", "md", "pptx", "xlsx", "csv", "txt"])
  .describe("The type of file to create");

type fileTypeEnum = z.infer<typeof fileTypes>;

const fileTypeLibraries: Record<fileTypeEnum, string[]> = {
  ipynb: ["nbformat"],
  pdf: ["reportlab"],
  md: [],
  pptx: ["python-pptx"],
  xlsx: ["pandas", "openpyxl"],
  csv: ["pandas"],
  txt: [],
} as const;

const fileCreatorTool = ({ writer }: FileManagerToolParams) =>
  tool({
    name: "file-creator",
    description: `Use this tool to create the following file types:
    - .ipynb (requires: nbformat)
    - .pdf (requires: reportlab)
    - .md (no dependencies)
    - .pptx/ppt (requires: python-pptx)
    - .xlsx/xls (requires: pandas)
    - .csv (requires: pandas)
    - .txt (no dependencies)
    `,
    inputSchema: z.object({
      type: fileTypes.describe("The type of file to create"),
      filename: z
        .string()
        .describe("The name of the file to create with the extension"),
      plan: z
        .string()
        .describe(
          "The plan for the file to be created contains the point by point of what needs to be written in the file"
        ),
      details: z
        .string()
        .describe(
          "Key details about the content to be included in the file. take note of figures, numbers, sources and more"
        ),
    }),
    execute: async (
      { type, filename, plan, details },
      { toolCallId: runId }
    ) => {
      const startDatetime = Date.now();

      writer.write({
        type: "data-chain-of-thought-run-start",
        data: {
          status: "pending",
          type: "agentic-file-creator",
          id: runId,
          startDatetime,
          steps: {},
        },
      });
      const sandboxRunner = new SandboxRunner(
        {
          runId,
          type: "python",
          writer,
          dependencies: fileTypeLibraries[type],
          files: [],
        },
        true
      );
      await sandboxRunner.start();

      try {
        const AgentClass = fileAgents[type];
        if (!AgentClass) {
          throw new Error(`No agent found for file type: ${type}`);
        }
        const agent = new AgentClass({ sandboxRunner });
        return await agent.run({ plan, details, filename });
      } catch (error) {
        console.error(error);
      } finally {
        writer.write({
          type: "data-chain-of-thought-run-end",
          data: {
            status: "completed",
            type: "agentic-file-creator",
            id: runId,
            endDatetime: Date.now(),
          },
        });
        await sandboxRunner.stop();
      }
    },
  });

export { fileCreatorTool };
