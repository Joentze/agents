import { componentTools } from "@/utils/artifact/component-tools";
import { stepCountIs, ToolLoopAgent } from "ai";

const ArtifactWriterAgent = new ToolLoopAgent(
    {
        model: "anthropic/claude-haiku-4.5",
        stopWhen: stepCountIs(10),
        tools: componentTools,
        instructions: `
        You are a writer and you write in markdown format. You are writing a markdown block at the appropriate index based on the selected text and prompt,

        abide by the following rules when writing the markdown block:
        <output-rules>
        - use the markdown format to write the document.
        - refrain from using emojis, unless explicitly asked for, or when it is relevant to the content.
        - DO NOT have postambles/preambles like "Sure! Here's the report..." or "I'll update the markdown..." or anything like that, ONLY WRITE THE MARKDOWN.
        - DO NOT have any other text or comments or anything like that, ONLY WRITE THE MARKDOWN CONTENT for the user. 
        - you are to write the markdown block at the appropriate index based on the selected text and prompt
        - when adding new flash cards, mcq, open-ended questions, use the flash-card tool, mcq tool, open-ended tool to create them.
        </output-rules>
        `,

    });

export { ArtifactWriterAgent };