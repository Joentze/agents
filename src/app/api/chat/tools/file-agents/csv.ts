import z from "zod";
import { searchTool } from "../search";
import {
  FileSandboxAgent,
  FileSandboxAgentParams,
  RunParams,
} from "./file-sandbox-agent";
import { generateText, stepCountIs } from "ai";
import { tool } from "ai";

class CSVAgent extends FileSandboxAgent {
  constructor({ sandboxRunner }: FileSandboxAgentParams) {
    super({ sandboxRunner });
  }
  async run(params: RunParams): Promise<string> {
    const { plan, details, filename } = params;
    const { text } = await generateText({
      model: this.model,
      prompt: `Based on the plan and details, you will use create-csv tool to write code to create a CSV file.
      The plan is: ${plan}
      The details are: ${details}
      Use the search tool to find the most relevant sources for the CSV file if necessary.
  
      Use the \`pandas\` library to create the CSV file.
      
      ## 📊 Pandas CSV Quick Guide

      ### 1. Basic CSV Creation
      \`\`\`python
      import pandas as pd

      # Create a DataFrame from a dictionary
      data = {
          'Name': ['Alice', 'Bob', 'Charlie'],
          'Age': [25, 30, 35],
          'City': ['New York', 'Paris', 'London']
      }
      df = pd.DataFrame(data)
      
      # Save to CSV
      df.to_csv('output.csv', index=False)
      \`\`\`

      ### 2. Creating from Lists
      \`\`\`python
      import pandas as pd

      # Create from list of lists
      data = [
          ['Alice', 25, 'New York'],
          ['Bob', 30, 'Paris'],
          ['Charlie', 35, 'London']
      ]
      df = pd.DataFrame(data, columns=['Name', 'Age', 'City'])
      df.to_csv('output.csv', index=False)
      \`\`\`

      ### 3. CSV Options
      \`\`\`python
      # Custom delimiter
      df.to_csv('output.csv', sep=';', index=False)
      
      # Include index
      df.to_csv('output.csv', index=True)
      
      # Custom headers
      df.to_csv('output.csv', header=['Col1', 'Col2', 'Col3'], index=False)
      
      # Encoding
      df.to_csv('output.csv', encoding='utf-8', index=False)
      
      # Quote all fields
      df.to_csv('output.csv', quoting=1, index=False)
      \`\`\`

      ### 4. Handling Missing Values
      \`\`\`python
      import pandas as pd
      import numpy as np

      data = {
          'Name': ['Alice', 'Bob', None],
          'Age': [25, None, 35],
          'City': ['New York', 'Paris', 'London']
      }
      df = pd.DataFrame(data)
      
      # Replace NaN with empty string
      df.to_csv('output.csv', na_rep='', index=False)
      \`\`\`

      ### 5. Large Datasets
      \`\`\`python
      # For very large datasets, you can use chunking
      # But for creation, just ensure efficient data structures
      df.to_csv('output.csv', index=False, chunksize=10000)
      \`\`\`

      ### 6. Tips
      * Always use **index=False** unless you need row numbers
      * Use **encoding='utf-8'** for international characters
      * Use **na_rep=''** to handle missing values cleanly
      * Set appropriate column names with the **columns** parameter
      * For tab-separated values, use **sep='\\t'**

      Write the code to create the CSV file in the results/ directory like this:
      \`\`\`python
      df.to_csv('results/${filename}', index=False)
      \`\`\`
      `,
      stopWhen: stepCountIs(3),
      toolChoice: "required",
      tools: {
        searchTool,
        createCsv: tool({
          name: "create-csv",
          description: "Write python code to create a CSV file",
          inputSchema: z.object({
            code: z.string().describe("The code to create the CSV file"),
          }),
          execute: async ({ code }) => {
            const createCsv = await this.sandboxRunner.runCommandStep({
              cmd: "python",
              args: ["-c", code],
              beforeLabel: "Creating CSV",
              afterLabel: "CSV created",
            });
            return createCsv;
          },
        }),
      },
    });
    const resultFiles = await this.getResultFiles();
    return `${text} \n\n The result files are: ${resultFiles}`;
  }
}

export { CSVAgent };
