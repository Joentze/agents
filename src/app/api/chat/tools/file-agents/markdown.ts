import z from "zod";
import { searchTool } from "../search";
import {
  FileSandboxAgent,
  FileSandboxAgentParams,
  RunParams,
} from "./file-sandbox-agent";
import { generateText, stepCountIs } from "ai";
import { tool } from "ai";

class MarkdownAgent extends FileSandboxAgent {
  constructor({ sandboxRunner }: FileSandboxAgentParams) {
    super({ sandboxRunner });
  }
  async run(params: RunParams): Promise<string> {
    const { plan, details, filename } = params;
    const { text } = await generateText({
      model: this.model,
      prompt: `Based on the plan and details, you will use create-markdown tool to write code to create a markdown document.
      The plan is: ${plan}
      The details are: ${details}
      Use the search tool to find the most relevant sources for the markdown document if necessary.
  
      Write the code to the results/ directory like this:
      \`\`\`python
      with open('results/${filename}', 'w') as f:
          f.write(markdown)
      \`\`\`
      `,
      stopWhen: stepCountIs(2),
      toolChoice: "required",
      tools: {
        searchTool,
        createMarkdown: tool({
          name: "create-markdown",
          description: "Write python code to create a markdown document",
          inputSchema: z.object({
            code: z
              .string()
              .describe("The code to create the markdown document"),
          }),
          execute: async ({ code }) => {
            const createMarkdown = await this.sandboxRunner.runCommandStep({
              cmd: "python",
              args: ["-c", code],
              beforeLabel: "Creating Markdown",
              afterLabel: "Markdown created",
            });
            return createMarkdown;
          },
        }),
      },
    });
    const resultFiles = await this.getResultFiles();
    return `${text} \n\n The result files are: ${resultFiles}`;
  }
}

export { MarkdownAgent };
