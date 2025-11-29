const generateFilesPrompt = `Use this tool to generate and upload Next.js application files into an existing Vercel Sandbox. It leverages an LLM to create production-ready file contents based on the current conversation context and user intent, then writes them directly into the sandbox file system.

**This tool is specifically optimized for Next.js App Router applications.** All generated files will follow Next.js conventions, including proper App Router structure, TypeScript support, and modern React patterns.

**IMPORTANT: The sandbox is initialized from shadcn-ui/next-template** which already includes:
- Configuration files (next.config.ts, tsconfig.json, tailwind.config.ts, postcss.config.mjs)
- Pre-installed shadcn UI components in \`components/ui/\`
- Proper Tailwind CSS setup with globals.css
- Root layout with correct setup

**You should ONLY generate application-specific files:**
- \`app/page.tsx\` - Your main page component
- Custom components in \`components/\` directory (NOT in components/ui/)
- API routes in \`app/api/\`
- Additional pages or routes as needed

**DO NOT generate these files (already in template):**
- package.json (unless adding new dependencies)
- tsconfig.json
- next.config.ts
- tailwind.config.ts
- postcss.config.mjs
- app/globals.css
- app/layout.tsx (unless specifically modifying it)
- Any files in components/ui/

All file paths must be relative to the sandbox root (e.g., \`app/page.tsx\`, \`components/CustomComponent.tsx\`, \`app/api/users/route.ts\`).

## When to Use This Tool

Use Generate Files when:

1. You need to create application-specific files (pages, components, API routes)
2. The user requests code that implies file creation (e.g., new routes, APIs, custom components)
3. You need to implement features or functionality in the Next.js app
4. You're completing a multi-step task that involves generating or updating application code
5. A prior command failed due to a missing application file, and you need to supply it

**Remember**: Configuration files are already in the template - focus on app-specific files only!

## File Generation Guidelines

- Every file must be complete, valid, and runnable where applicable
- File contents must reflect the user's intent and the overall session context
- File paths must be well-structured and use consistent naming conventions
- Generated files should assume compatibility with other existing files in the sandbox

## Best Practices

- Focus on generating application-specific files (app/page.tsx, custom components, API routes)
- **DO NOT regenerate config files** - they're already properly set up in the template
- Use shadcn UI components from \`@/components/ui/\` - they're pre-installed!
- Create custom components in \`components/\` directory (NOT in components/ui/)
- Avoid redundant file generation if the file already exists and is unchanged
- Use conventional file/folder structures for Next.js App Router
- If replacing an existing file, ensure the update fully satisfies the user's request

## Examples of When to Use This Tool

<example>
User: Create a todo list app
Assistant: I'll generate the main page component with the todo list functionality using shadcn components.
*Uses Generate Files to create:*
- \`app/page.tsx\` (client component with todo list, using shadcn Button, Input, Card components)
</example>

<example>
User: Add a dashboard page with an API route to fetch user data
Assistant: I'll generate the necessary Next.js files for the dashboard and API.
*Uses Generate Files to create:*
- \`app/dashboard/page.tsx\` (dashboard page using shadcn components)
- \`app/api/users/route.ts\` (API route handler with GET export)
- \`lib/users.ts\` (utility functions if needed)
</example>

<example>
User: Add a custom navigation component
Assistant: I'll create a custom NavBar component in the components directory.
*Uses Generate Files to create:*
- \`components/NavBar.tsx\` (client component using shadcn Button, using 'use client')
</example>

<example>
User: I need a contact form with validation
Assistant: I'll create a contact form page using shadcn form components.
*Uses Generate Files to create:*
- \`app/contact/page.tsx\` (form page using shadcn Input, Button, Textarea components)
- \`app/api/contact/route.ts\` (API route to handle form submission)
</example>

## When NOT to Use This Tool

Avoid using this tool when:

1. You need to generate config files - **they already exist in the template!** (next.config.ts, tsconfig.json, tailwind.config.ts, postcss.config.mjs)
2. You want to create shadcn UI components - **they're already in components/ui/**
3. You only need to execute code or install packages (use Run Command instead)
4. You're waiting for a command to finish (use Wait Command)
5. You want to preview a running server or UI (use Get Sandbox URL)
6. You haven't created a sandbox yet (use Create Sandbox first)

## Output Behavior

After generation, the tool will return a list of the files created, including their paths and contents. These can then be inspected, referenced, or used in subsequent commands.

## Summary

Use Generate Files to programmatically create application-specific files in your Vercel Sandbox. The sandbox starts with the shadcn-ui/next-template which includes all configuration files and UI components.

**Focus on generating:**
- \`app/page.tsx\` and other page routes
- Custom components in \`components/\` (not components/ui/)
- API routes in \`app/api/\`
- Utility functions in \`lib/\`

**Do NOT generate:** Configuration files, layout.tsx, globals.css, or components/ui/ files - these are already in the template!

This tool enables fast iteration, contextual coding, and dynamic file management — all driven by user intent and conversation context.
`;

export { generateFilesPrompt };
