import z from "zod";
import {
  FileSandboxAgent,
  FileSandboxAgentParams,
  RunParams,
} from "./file-sandbox-agent";
import { generateObject } from "ai";

class PyNotebookAgent extends FileSandboxAgent {
  constructor({ sandboxRunner }: FileSandboxAgentParams) {
    super({ sandboxRunner, model: "alibaba/qwen3-coder" });
  }
  async run(params: RunParams): Promise<string> {
    const { plan, details, filename } = params;

    const {
      object: { code },
    } = await generateObject({
      model: this.model,
      schema: z.object({
        code: z.string(),
      }),
      prompt: `You are a python notebook agent, you use the \`nbformat\` library to create a python notebook.
      You are given a filename, and a plan. Follow the plan to create the python notebook.
      
      ## Core Imports & Setup
      \`\`\`python
      import nbformat
      from nbformat.v4 import new_notebook, new_code_cell, new_markdown_cell, new_output
      \`\`\`

      ## Basic Structure
      - nbformat uses version 4 (v4) for current Jupyter notebooks (.ipynb format)
      - A notebook consists of cells: code cells and markdown cells
      - Cells are executed in order and can have outputs (for code cells)
      - Always save with nbformat.write(nb, filename) to write the .ipynb file

      ## Creating a Notebook

      # Basic notebook creation
      \`\`\`python
      import nbformat
      from nbformat.v4 import new_notebook, new_code_cell, new_markdown_cell

      # Create a new notebook
      nb = new_notebook()

      # Add cells to the notebook
      nb.cells = [
          new_markdown_cell("# Title"),
          new_code_cell("print('Hello, World!')"),
      ]

      # Save the notebook
      with open('${filename}', 'w') as f:
          nbformat.write(nb, f)
      \`\`\`

      ## Creating Different Cell Types

      # Markdown cells (for text, titles, explanations)
      \`\`\`python
      markdown_cell = new_markdown_cell("""
      # Main Title
      
      This is a **markdown** cell with:
      - Bullet points
      - *Italic* and **bold** text
      - Code: \\\`x = 5\\\`
      
      ## Subsection
      You can use LaTeX: $E = mc^2$
      """)
      \`\`\`

      # Code cells (for executable Python code)
      \`\`\`python
      code_cell = new_code_cell("""
      import pandas as pd
      import numpy as np
      
      data = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
      print(data.head())
      """)
      \`\`\`

      # Code cells with outputs (simulate executed results)
      \`\`\`python
      from nbformat.v4 import new_output

      code_cell = new_code_cell("x = 5\\nprint(x * 2)")
      
      # Add output to the cell (optional - simulates execution)
      code_cell.outputs = [
          new_output(
              output_type='stream',
              name='stdout',
              text='10\\n'
          )
      ]
      \`\`\`

      ## Key Tips
      - Module name is 'nbformat', not 'nbformat-python'
      - Always use nbformat.v4 for current notebook format
      - Cell source can be a string or list of strings (one per line)
      - Use triple-quoted strings for multi-line code/markdown
      - new_code_cell() and new_markdown_cell() are the main cell creators
      - Cells are stored in nb.cells as a list
      - Use nbformat.write(nb, file_object) or nbformat.write(nb, filename) to save
      - For outputs, you typically don't need them unless simulating executed notebooks
      - Organize notebooks with markdown headers (# ## ###) for structure

      Write code to create the python notebook.
      The plan is: ${plan}
      The details are: ${details}
      ALWAYS write the code to the results/ directory like this:
      \`\`\`python
      with open('results/${filename}', 'w') as f:
          nbformat.write(nb, f)
      \`\`\`
      `,
    });

    await this.sandboxRunner.runCommandStep({
      cmd: "python",
      args: ["-c", code],
      beforeLabel: "Creating Python Notebook",
      afterLabel: "Python Notebook created",
    });

    const resultFiles = await this.getResultFiles();
    return `Python notebook created successfully. \n\n The result files are: ${resultFiles}`;
  }
}

export { PyNotebookAgent };
