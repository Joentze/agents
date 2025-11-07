import z from "zod";
import { searchTool } from "../search";
import {
  FileSandboxAgent,
  FileSandboxAgentParams,
  RunParams,
} from "./file-sandbox-agent";
import { generateText, stepCountIs } from "ai";
import { tool } from "ai";

class PDFAgent extends FileSandboxAgent {
  constructor({ sandboxRunner }: FileSandboxAgentParams) {
    super({ sandboxRunner });
  }
  async run(params: RunParams): Promise<string> {
    const { plan, details, filename } = params;
    const { text } = await generateText({
      model: this.model,
      prompt: `Based on the plan and details, you will use create-pdf tool to write code to create a PDF document.
      The plan is: ${plan}
      The details are: ${details}
      Use the search tool to find the most relevant sources for the PDF document if necessary.
  
      Use the \`reportlab\` library to create the PDF document.
      ## 🧾 ReportLab Quick Guide
  
      ### 1. Install
      \`\`\`bash
      pip install reportlab
      \`\`\`
  
      ### 2. Basic PDF Creation
      \`\`\`python
      from reportlab.pdfgen import canvas
  
      c = canvas.Canvas("example.pdf")
      c.drawString(100, 750, "Hello, ReportLab!")
      c.save()
      \`\`\`
  
      ### 3. Using Platypus (Preferred for structured layouts)
      \`\`\`python
      from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
      from reportlab.lib.styles import getSampleStyleSheet
  
      doc = SimpleDocTemplate("structured.pdf")
      styles = getSampleStyleSheet()
      content = [
          Paragraph("ReportLab Structured Document", styles["Title"]),
          Spacer(1, 12),
          Paragraph("This is a paragraph using Platypus.", styles["Normal"])
      ]
      doc.build(content)
      \`\`\`
  
      ### 4. Adding Tables and Images
      \`\`\`python
      from reportlab.platypus import Table, TableStyle, Image
      from reportlab.lib import colors
  
      table_data = [["Header 1", "Header 2"], ["Row 1", "Data"], ["Row 2", "More Data"]]
      table = Table(table_data)
      table.setStyle(TableStyle([
          ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
          ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
          ("GRID", (0, 0), (-1, -1), 1, colors.black)
      ]))
  
      img = Image("logo.png", width=100, height=50)
  
      doc.build([img, Spacer(1, 12), table])
      \`\`\`
  
      ### 5. Page Formatting
      \`\`\`python
      from reportlab.lib.pagesizes import A4, landscape
      doc = SimpleDocTemplate("landscape.pdf", pagesize=landscape(A4))
      \`\`\`
  
      ### 6. Fonts & Unicode
      \`\`\`python
      from reportlab.pdfbase import pdfmetrics
      from reportlab.pdfbase.cidfonts import UnicodeCIDFont
  
      pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))  # Japanese example
      \`\`\`
  
      ### 7. Tips
      * Always use **Platypus** for structured documents.
      * Use **reportlab.lib.units** (\`inch\`, \`cm\`) for consistent spacing.
      * Use **Canvas** for precise drawing (charts, diagrams).
  
      Write the code to the results/ directory like this:
      \`\`\`python
      with open('results/${filename}', 'w') as f:
          f.write(pdf)
      \`\`\`
      `,
      stopWhen: stepCountIs(3),
      toolChoice: "required",
      tools: {
        searchTool,
        createPdf: tool({
          name: "create-pdf",
          description: "Write python code to create a PDF document",
          inputSchema: z.object({
            code: z.string().describe("The code to create the PDF document"),
          }),
          execute: async ({ code }) => {
            const createPdf = await this.sandboxRunner.runCommandStep({
              cmd: "python",
              args: ["-c", code],
              beforeLabel: "Creating PDF",
              afterLabel: "PDF created",
            });
            return createPdf;
          },
        }),
      },
    });
    const resultFiles = await this.getResultFiles();
    return `${text} \n\n The result files are: ${resultFiles}`;
  }
}

export { PDFAgent };
