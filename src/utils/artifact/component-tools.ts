import { tool, zodSchema } from "ai";
import { z } from "zod";

const flashCardTool = tool({
  description: "Use the flash-card tool when creating flash cards",
  inputSchema: zodSchema(
    z.object({
      title: z.string().describe("The title of the flash cards"),
      cards: z
        .array(
          z.object({
            question: z.string().describe("The question of the flash card"),
            answer: z.string().describe("The answer of the flash card"),
          })
        )
        .describe("The cards of the flash card"),
    })
  ),
  execute: async ({ cards }) => {
    return cards.map((card) => ({
      question: card.question,
      answer: card.answer,
    }));
  },
});

const mcqTool = tool({
  description: "Use the mcq tool when creating mcqs",
  inputSchema: zodSchema(
    z.object({
      questions: z.array(
        z.object({
          question: z.string().describe("The question of the mcq"),
          options: z.array(
            z.object({
              option: z.string().describe("The option of the mcq"),
              isCorrect: z.boolean().describe("Whether the option is correct"),
            })
          ),
        })
      ),
    })
  ),
});

const openEndedTool = tool({
  description: "Use the open-ended tool when creating open-ended questions",
  inputSchema: zodSchema(
    z.object({
      questions: z.array(
        z.object({
          question: z.string().describe("The question of the open-ended"),
          recommendedAnswer: z
            .string()
            .describe("The recommended answer of the open-ended"),
        })
      ),
    })
  ),
});

/**
 * Component tools for creating interactive learning elements
 */
const componentTools = {
  flashCardTool,
  mcqTool,
  openEndedTool,
};

export { flashCardTool, mcqTool, openEndedTool, componentTools };
