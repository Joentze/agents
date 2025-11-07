const generateFilesPrompt = `Use this tool to generate and upload Next.js application files into an existing Vercel Sandbox. It leverages an LLM to create production-ready file contents based on the current conversation context and user intent, then writes them directly into the sandbox file system.

**This tool is specifically optimized for Next.js App Router applications.** All generated files will follow Next.js conventions, including proper App Router structure, TypeScript support, and modern React patterns.

The generated files should be considered correct on first iteration and suitable for immediate use in the sandbox environment. This tool is essential for scaffolding Next.js apps, adding new features, writing configuration files, or fixing missing components.

All file paths must be relative to the sandbox root (e.g., \`app/page.tsx\`, \`package.json\`, \`components/Button.tsx\`, \`app/api/users/route.ts\`).

## When to Use This Tool

Use Generate Files when:

1. You need to create one or more new files as part of a feature, scaffold, or fix
2. The user requests code that implies file creation (e.g., new routes, APIs, components, services)
3. You need to bootstrap a new application structure inside a sandbox
4. You're completing a multi-step task that involves generating or updating source code
5. A prior command failed due to a missing file, and you need to supply it

## File Generation Guidelines

- Every file must be complete, valid, and runnable where applicable
- File contents must reflect the user's intent and the overall session context
- File paths must be well-structured and use consistent naming conventions
- Generated files should assume compatibility with other existing files in the sandbox

## Best Practices

- Avoid redundant file generation if the file already exists and is unchanged
- Use conventional file/folder structures for the tech stack in use
- If replacing an existing file, ensure the update fully satisfies the user's request

## Examples of When to Use This Tool

<example>
User: Add a \`NavBar.tsx\` component and include it in the root layout
Assistant: I'll generate the \`NavBar.tsx\` component and update the root layout to include it.
*Uses Generate Files to create:*
- \`components/NavBar.tsx\` (client component with 'use client')
- Modified \`app/layout.tsx\` with import and usage of \`NavBar\`
</example>

<example>
User: Create a new dashboard page with an API route to fetch user data
Assistant: I'll generate the necessary Next.js files for the dashboard and API.
*Uses Generate Files to create:*
- \`app/dashboard/page.tsx\` (server component)
- \`app/api/users/route.ts\` (API route handler with GET export)
- \`lib/users.ts\` (utility functions)
</example>

<example>
User: Bootstrap a new Next.js app with TypeScript and Tailwind
Assistant: I'll scaffold a complete Next.js application structure.
*Uses Generate Files to create:*
- \`package.json\` (with Next.js, React, TypeScript dependencies)
- \`app/layout.tsx\` (root layout)
- \`app/page.tsx\` (home page)
- \`tailwind.config.ts\` and \`postcss.config.mjs\`
- \`next.config.ts\`
- \`tsconfig.json\`
</example>

\`next.config.ts\` must always be in .ts format.

## When NOT to Use This Tool

Avoid using this tool when:

1. You only need to execute code or install packages (use Run Command instead)
2. You're waiting for a command to finish (use Wait Command)
3. You want to preview a running server or UI (use Get Sandbox URL)
4. You haven't created a sandbox yet (use Create Sandbox first)

## Output Behavior

After generation, the tool will return a list of the files created, including their paths and contents. These can then be inspected, referenced, or used in subsequent commands.

## Summary

Use Generate Files to programmatically create or update files in your Vercel Sandbox. It enables fast iteration, contextual coding, and dynamic file management — all driven by user intent and conversation context.
`;

export { generateFilesPrompt };
