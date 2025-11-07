import z from "zod";
import { searchTool } from "../search";
import {
  FileSandboxAgent,
  FileSandboxAgentParams,
  RunParams,
} from "./file-sandbox-agent";
import { generateText, stepCountIs } from "ai";
import { tool } from "ai";

class XLSXAgent extends FileSandboxAgent {
  constructor({ sandboxRunner }: FileSandboxAgentParams) {
    super({ sandboxRunner });
  }
  async run(params: RunParams): Promise<string> {
    const { plan, details, filename } = params;

    // First step: Plan the Excel file structure
    const excelPlan = await this.sandboxRunner.runStep({
      beforeLabel: "Planning Excel file structure",
      afterLabel: "Excel structure planned",
      stepFunction: async () => {
        const { text } = await generateText({
          model: "openai/gpt-4.1-nano",
          prompt: `Based on the plan and details, you will generate a structured plan for how the Excel file should be organized.
      The plan is: ${plan}
      The details are: ${details}

      Your plan should include:
      1. Sheet names and their purposes
      2. Column headers and data types for each sheet
      3. Any formulas or calculations needed
      4. Formatting requirements (if any)
      5. Data sources and organization

      Your plan should be in the following format:

      \`\`\`
      ### Sheet: <Sheet Name>
      purpose: <Purpose of the sheet>
      columns: <List of column headers>
      data_description: <Description of what data goes in each column>
      formulas: <Any formulas needed, if applicable>
      sources: <Relevant sources for the data>
      \`\`\`

      You should have a plan for each sheet.
      Use the search tool to find the most relevant sources for the data if necessary.
      `,
        });
        return text;
      },
    });
    console.log(excelPlan);
    // Second step: Create the Excel file
    const { text } = await generateText({
      model: this.model,
      prompt: `You are an Excel agent. You ONLY use the \`pandas\` library to create Excel files.
      You are given a filename, a plan, and details. Follow the plan to create the Excel file.
      ALWAYS create the file in the results/ directory.
      ALWAYS use the filename provided to create the file.

      filename: ${filename}
      plan: ${plan}
      details: ${excelPlan}
    
      ## 📊 Pandas Excel Reference

      \`\`\`python
      import pandas as pd

      # Single sheet
      data = {
          'Name': ['Alice', 'Bob', 'Charlie'],
          'Age': [25, 30, 35],
          'City': ['New York', 'Paris', 'London']
      }
      df = pd.DataFrame(data)
      df.to_excel('results/${filename}', index=False, sheet_name='Sheet1')

      # Multiple sheets
      with pd.ExcelWriter('results/${filename}') as writer:
          df1.to_excel(writer, sheet_name='Sheet1', index=False)
          df2.to_excel(writer, sheet_name='Sheet2', index=False)
          df3.to_excel(writer, sheet_name='Summary', index=False)
      
      # From list of lists
      data = [
          ['Name', 'Age', 'City'],
          ['Alice', 25, 'New York'],
          ['Bob', 30, 'Paris']
      ]
      df = pd.DataFrame(data[1:], columns=data[0])
      df.to_excel('results/${filename}', index=False)
      \`\`\`

      **Key Points:**
      - Use \`pd.DataFrame()\` to create data
      - Use \`to_excel()\` for single sheet
      - Use \`pd.ExcelWriter()\` for multiple sheets
      - Always set \`index=False\` to avoid row numbers
      - Always save to \`results/${filename}\`

      If the creation fails, say "Excel file ${filename} creation failed"
      If the creation succeeds, say "Excel file ${filename} created successfully"
      `,
      toolChoice: "required",
      tools: {
        createXlsx: tool({
          name: "create-xlsx",
          description: "Create an Excel file using pandas",
          inputSchema: z.object({
            code: z.string().describe("The code to create the Excel file"),
          }),
          execute: async ({ code }) => {
            const createXlsx = await this.sandboxRunner.runCommandStep({
              cmd: "python",
              args: ["-c", code],
              beforeLabel: "Creating Excel file",
              afterLabel: "Excel file created",
            });
            return createXlsx;
          },
        }),
      },
    });
    const resultFiles = await this.getResultFiles();
    return `${text} \n\n The result files are: ${resultFiles}`;
  }
}

export { XLSXAgent };
