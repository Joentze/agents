import { AppAgentToolParams } from "@/app/types/app-agent";
import { generateFilesPrompt as description } from "./generate-files-prompt";
import {
  convertToModelMessages,
  generateObject,
  ModelMessage,
  streamObject,
  streamText,
  tool,
  UIMessage,
  UIMessageStreamWriter,
} from "ai";
import z from "zod";
import { AppRunner } from "../../classes/app-runner";

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
    const { fullStream } = streamText({
      model: "anthropic/claude-sonnet-4.5",
      maxOutputTokens: 5000,
      system: `You are a Next.js file content generator specialized in creating production-ready files for Next.js applications.

## Context
You are generating files for a **Next.js App Router** application. All files must follow Next.js conventions and best practices.

## Critical Rules
1. **NEVER** generate lock files (pnpm-lock.yaml, package-lock.json, yarn.lock) - package managers create these automatically
2. **NEVER** add markdown code fences (\`\`\` or \`\`\`language) - return ONLY the raw file content
3. Generate complete, production-ready code - no placeholders or TODOs
4. Follow Next.js App Router conventions (app/ directory, route handlers, server/client components)

## Next.js App Structure
- \`app/\` - App Router pages and layouts (use this, not pages/)
- \`app/api/\` - API routes using route.ts files
- \`components/\` - React components (mark client components with 'use client')
- \`lib/\` - Utility functions and helpers
- \`public/\` - Static assets
- Root files: next.config.ts, tsconfig.json, tailwind.config.ts, etc.

## Package.json Requirements
When generating package.json, it MUST:
- Include "next" as a dependency (latest version or specified)
- Include "react" and "react-dom" as dependencies
- Have Next.js scripts: "dev": "next dev", "build": "next build", "start": "next start"
- Use "type": "module" if using ESM
- Include TypeScript dependencies if using .ts/.tsx files
- Example structure:
  {
    "name": "nextjs-app",
    "version": "0.1.0",
    "private": true,
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start"
    },
    "dependencies": {
      "next": "^15.0.0",
      "react": "^18.3.0",
      "react-dom": "^18.3.0"
    },
    "devDependencies": {
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      "typescript": "^5"
    }
  }

## File Generation Best Practices
- TypeScript: Use proper types, interfaces, and type safety
- Server Components: Default in App Router, no 'use client' needed
- Client Components: Add 'use client' directive when using hooks, event handlers, or browser APIs
- API Routes: Use route.ts with named exports (GET, POST, etc.)
- Imports: Use @/ alias for src/ directory imports
- Styling: Use Tailwind CSS classes if applicable, or CSS modules

Review the conversation history to understand the user's requirements and generate files that fulfill their exact needs.`,
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
