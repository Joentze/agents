import { AppAgentToolParams } from "@/app/types/app-agent";
import { generateFilesPrompt as description } from "./generate-files-prompt";
import {
  convertToModelMessages,
  ModelMessage,
  streamText,
  tool,
  UIMessage,
  UIMessageStreamWriter,
} from "ai";
import z from "zod";
import { AppRunner } from "../../classes/app-runner";
import { generateFileContentsPrompt as system } from "./generate-file-contents-prompt";

// export class Deferred<T> {
//   private resolveFn: (value: T | PromiseLike<T>) => void = () => {};
//   private rejectFn: (reason?: any) => void = () => {};
//   private _promise: Promise<T>;

//   constructor() {
//     this._promise = new Promise<T>((resolve, reject) => {
//       this.resolveFn = resolve;
//       this.rejectFn = reject;
//     });
//   }

//   get promise() {
//     return this._promise;
//   }

//   resolve(value: T | PromiseLike<T>): void {
//     this.resolveFn(value);
//   }

//   reject(reason?: any): void {
//     this.rejectFn(reason);
//   }
// }

const fileSchema = z.object({
  path: z
    .string()
    .describe(
      "Path to the file in the Vercel Sandbox (relative paths from sandbox root, e.g., 'src/main.js', 'package.json', 'components/Button.tsx')"
    ),
  content: z
    .string()
    .describe(
      "The content of the file as a utf8 string (complete file contents that will replace any existing file at this path)"
    ),
});

interface FileContentChunk {
  files: z.infer<typeof fileSchema>[];
  paths: string[];
  written: string[];
}
// async function* generateFileContents({
//   paths,
//   messages,
// }: {
//   paths: string[];
//   messages: UIMessage[];
//   runner: AppRunner;
// }): AsyncGenerator<FileContentChunk> {
//   const generated: z.infer<typeof fileSchema>[] = [];
//   const deferred = new Deferred<void>();
//   const result = streamObject({
//     model: "openai/gpt-5-nano",
//     maxOutputTokens: 64000,
//     system:
//       "You are a file content generator. You must generate files based on the conversation history and the provided paths. NEVER generate lock files (pnpm-lock.yaml, package-lock.json, yarn.lock) - these are automatically created by package managers.",
//     messages: [
//       ...convertToModelMessages(messages),
//       {
//         role: "user",
//         content: `Generate the content of the following files according to the conversation: ${paths.map(
//           (path) => `\n - ${path}`
//         )}`,
//       },
//     ],
//     schema: z.object({ files: z.array(fileSchema) }),
//     onError: (error) => {
//       deferred.reject(error);
//       console.error("Error communicating with AI");
//       console.error(JSON.stringify(error, null, 2));
//     },
//   });

//   for await (const items of result.partialObjectStream) {
//     if (!Array.isArray(items?.files)) {
//       continue;
//     }

//     const written = generated.map((file) => file.path);
//     const currentPaths = written.concat(
//       items.files
//         .slice(generated.length, items.files.length - 1)
//         .flatMap((f) => (f?.path ? [f.path] : []))
//     );

//     const files = items.files
//       .slice(generated.length, items.files.length - 2)
//       .map((file) => fileSchema.parse(file));

//     if (files.length > 0) {
//       yield { files, paths: currentPaths, written };
//       generated.push(...files);
//     } else {
//       yield { files: [], written, paths: currentPaths };
//     }
//   }

//   const raceResult = await Promise.race([result.object, deferred.promise]);
//   if (!raceResult) {
//     throw new Error(
//       "Unexpected Error: Deferred was resolved before the result"
//     );
//   }

//   const written = generated.map((file) => file.path);
//   const files = raceResult.files.slice(generated.length);
//   const finalPaths = written.concat(files.map((file) => file.path));
//   if (files.length > 0) {
//     yield { files, written, paths: finalPaths };
//     generated.push(...files);
//   }
// }

async function generateFileContents({
  writer,
  runner,
  paths,
  messages,
}: {
  writer: UIMessageStreamWriter;
  paths: string[];
  messages: UIMessage[];
  runner: AppRunner;
}): Promise<z.infer<typeof fileSchema>[]> {
  const generated: z.infer<typeof fileSchema>[] = [];

  for (const path of paths) {
    writer.write({
      type: "data-app-builder-create-file",
      data: {
        path,
      },
    });
    const { fullStream } = streamText({
      model: "vercel/v0-1.5-md",
      maxOutputTokens: 10000,
      system,
      messages: [
        ...convertToModelMessages(messages),
        ...generated.map(({ path, content }) => {
          return {
            role: "user",
            content: `The content of the file ${path} has been generated before, it is: ${content}`,
          } as ModelMessage;
        }),
        {
          role: "user",
          content: `Generate the content of the following file: ${path}, return only the content of the file, no other text or markdown. Do not include \`\`\` or \`\`\` at the beginning or end of the code nor any other text apart from the code. Code:`,
        },
      ],
    });
    let fileContent = "";
    for await (const chunk of fullStream) {
      switch (chunk.type) {
        case "text-delta":
          fileContent += chunk.text;
          writer.write({
            type: "data-app-builder-file-content-delta",
            data: {
              path,
              delta: chunk.text,
            },
          });
          break;
        default:
          break;
      }
    }
    const sandbox = runner.sandbox;
    if (!sandbox) {
      throw new Error("Sandbox not started");
    }
    console.log(`Writing file ${path} to sandbox`);
    console.log(`File content: ${fileContent}`);
    await sandbox.writeFiles([
      {
        path,
        content: Buffer.from(fileContent, "utf-8"),
      },
    ]);
    generated.push({ path, content: fileContent });
  }
  return generated;
}

function generateFiles({ runner, messages, writer }: AppAgentToolParams) {
  return tool({
    name: "generate-files",
    description,
    inputSchema: z.object({
      paths: z.array(z.string()).describe("The paths to the files to generate"),
    }),
    execute: async ({ paths }) => {
      console.log(paths);
      const files = await generateFileContents({
        paths,
        messages,
        runner,
        writer,
      });
      return `
      I have successfully generated the following files: ${files
        .map((file) => file.path)
        .join(", ")}
      Now install the dependencies and start the dev server by running the following command:
      \`\`\`
      pnpm install
      \`\`\`
      `;
    },
  });
}

export { generateFiles };
