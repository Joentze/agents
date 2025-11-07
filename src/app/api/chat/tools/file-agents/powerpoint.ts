import z from "zod";
import { searchTool } from "../search";
import {
  FileSandboxAgent,
  FileSandboxAgentParams,
  RunParams,
} from "./file-sandbox-agent";
import { generateText, stepCountIs } from "ai";
import { tool } from "ai";

class PowerpointAgent extends FileSandboxAgent {
  constructor({ sandboxRunner }: FileSandboxAgentParams) {
    super({ sandboxRunner, model: "openai/gpt-4.1-nano" });
  }
  async run(params: RunParams): Promise<string> {
    const { plan, details, filename } = params;

    // First step: Generate slide structure with sources
    const { text: slidePrompt } = await generateText({
      model: this.model,
      tools: {
        searchTool,
      },
      stopWhen: stepCountIs(5),
      prompt: `Based on the plan and details, you will generate a prompt with slides, content and relevant sources of what each slide should contain.
      The plan is: ${plan}
      The details are: ${details}

      Your prompt should be in the following format:

      \`\`\`
      ### Slide <Number>
      description: <Description of the slide>
      sources: <Relevant sources of the slide>
      \`\`\`

      You should have a prompt for each slide.
      Use the search tool to find the most relevant sources for each slide if necessary.
      `,
    });

    // Second step: Create the PowerPoint presentation
    const { text } = await generateText({
      model: this.model,
      prompt: `You are a powerpoint agent, you use the \`python-pptx\` library to create a powerpoint presentation.
      You are given a filename, and a plan. Follow the plan to create the powerpoint presentation.
      ALWAYS create the file in the results/ directory.
      ALWAYS use the filename provided to create the file.

      filename: ${filename}
      plan: ${plan}
      details: ${slidePrompt}
      
      Reference the following python-pptx guide:

      ## Core Imports & Setup
      \`\`\`python
      from pptx import Presentation
      from pptx.util import Inches, Pt, Cm
      from pptx.enum.text import PP_PARAGRAPH_ALIGNMENT
      from pptx.dml.color import RGBColor
      \`\`\`

      ## Basic Structure
      - Presentation() - top-level object; load existing with Presentation('file.pptx')
      - Slides created from layouts: prs.slide_layouts[0-6] (0=Title, 1=Title+Content, 6=Blank)
      - Shapes: everything on slides (text, images, tables) accessed via slide.shapes
      - Always call prs.save(filename) to write the file

      ## Common Operations

      # Title slide
      \`\`\`python
      prs = Presentation()
      slide = prs.slides.add_slide(prs.slide_layouts[0])
      slide.shapes.title.text = "Title Here"
      slide.placeholders[1].text = "Subtitle Here"
      \`\`\`

      # Bullet points (use placeholders for structured content)
      \`\`\`python
      slide = prs.slides.add_slide(prs.slide_layouts[1])
      slide.shapes.title.text = "Slide Title"
      body = slide.shapes.placeholders[1].text_frame
      body.text = "First bullet"
      p = body.add_paragraph()
      p.text = "Second bullet"
      p.level = 1  # indent level (0=top)
      \`\`\`

      # Textbox with formatting (arbitrary positioning)
      \`\`\`python
      slide = prs.slides.add_slide(prs.slide_layouts[6])
      txBox = slide.shapes.add_textbox(Inches(1), Inches(1.5), Inches(6), Inches(1.5))
      p = txBox.text_frame.paragraphs[0]
      p.text = "Custom text"
      p.font.size = Pt(24)
      p.font.bold = True
      p.alignment = PP_PARAGRAPH_ALIGNMENT.CENTER
      \`\`\`

      # Images
      \`\`\`python
      slide = prs.slides.add_slide(prs.slide_layouts[6])
      slide.shapes.add_picture('image.png', Inches(1), Inches(1), height=Inches(2))
      \`\`\`

      # Tables
      \`\`\`python
      slide = prs.slides.add_slide(prs.slide_layouts[6])
      shape = slide.shapes.add_table(3, 4, Inches(0.5), Inches(1), Inches(9), Inches(2))
      table = shape.table
      table.cell(0, 0).text = "Header 1"
      table.cell(1, 0).text = "Row 1 Data"
      \`\`\`

      ## Key Tips
      - Module is 'pptx' not 'python-pptx' (import from pptx import Presentation)
      - Use Inches(), Pt(), or Cm() for sizing/positioning
      - Access placeholders by index: slide.placeholders[1] or slide.shapes.title
      - For text formatting, use text_frame.paragraphs and paragraph.runs
      - To use custom templates: prs = Presentation('template.pptx')
      - Inserting table rows/columns is not built-in; recreate table if needed

      Write code to create the powerpoint presentation and save it to results/${filename}.

      If the creation fails, say "Powerpoint ${filename} creation failed"
      If the creation succeeds, say "Powerpoint ${filename} created successfully"
      `,
      toolChoice: "required",
      tools: {
        createPowerpoint: tool({
          name: "create-powerpoint",
          description: "Create a powerpoint presentation",
          inputSchema: z.object({
            code: z
              .string()
              .describe("The code to create the powerpoint presentation"),
          }),
          execute: async ({ code }) => {
            const createPowerpoint = await this.sandboxRunner.runCommandStep({
              cmd: "python",
              args: ["-c", code],
              beforeLabel: "Creating PowerPoint",
              afterLabel: "PowerPoint created",
            });
            return createPowerpoint;
          },
        }),
      },
    });
    const resultFiles = await this.getResultFiles();
    return `${text} \n\n The result files are: ${resultFiles}`;
  }
}

export { PowerpointAgent };
