import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = streamText({
    model: "openai/gpt-4.1-mini",
    system: `
    You are a helpful editor, given a piece of text, a prompt and context,
    Do not include any pre-ambles, or post-ambles, just the edits.
    `,
    prompt: `Edit the following text, based on the prompt:` + prompt,
    providerOptions: {
      openai: {
        reasoningEffort: "",
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
