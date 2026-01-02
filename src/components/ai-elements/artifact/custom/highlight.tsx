import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlight: {
      toggleHighlight: (attributes?: { color?: string }) => ReturnType;
      setHighlight: (attributes?: { color?: string }) => ReturnType;
      unsetHighlight: () => ReturnType;
    };
  }
}

// Color map for named colors to CSS values
const colorMap: Record<string, string> = {
  yellow: "#fef08a",
  green: "#bbf7d0",
  blue: "#bfdbfe",
  pink: "#fbcfe8",
  orange: "#fed7aa",
  purple: "#ddd6fe",
  red: "#fecaca",
  cyan: "#a5f3fc",
};

export const Highlight = Mark.create({
  name: "highlight",

  addOptions() {
    return {
      HTMLAttributes: {},
      colors: Object.keys(colorMap),
      defaultColor: "yellow",
    };
  },

  addAttributes() {
    return {
      color: {
        default: this.options.defaultColor,
        parseHTML: (element) =>
          element.getAttribute("data-color") || this.options.defaultColor,
        renderHTML: (attributes) => {
          const color = attributes.color || this.options.defaultColor;
          const bgColor = colorMap[color] || color;
          return {
            "data-color": color,
            style: `background-color: ${bgColor}; padding: 0.125em 0.25em; border-radius: 0.25em;`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "mark" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  // Define a custom Markdown tokenizer to recognize ==text== or ==text=={color}
  markdownTokenizer: {
    name: "highlight",
    level: "inline",
    // Fast hint for the lexer to find candidate positions
    start: (src: string) => src.indexOf("=="),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenize: (src: string, _tokens: any[], lexer: any) => {
      // Match ==text== or ==text=={color}
      const match = /^==([^=]+)==(?:\{([^}]+)\})?/.exec(src);
      if (!match) return undefined;

      return {
        type: "highlight",
        raw: match[0],
        text: match[1],
        color: match[2] || undefined,
        tokens: lexer.inlineTokens(match[1]),
      };
    },
  },

  // Parse Markdown token to Tiptap JSON
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parseMarkdown: (token: any, helpers: any) => {
    const content = helpers.parseInline(token.tokens || []);
    return helpers.applyMark("highlight", content, { color: token.color });
  },

  // Render Tiptap node back to Markdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderMarkdown: (node: any, helpers: any) => {
    const content = helpers.renderChildren(node.content || []);
    const color = node.attrs?.color;
    // Only include color suffix if it's not the default
    if (color && color !== "yellow") {
      return `==${content}=={${color}}`;
    }
    return `==${content}==`;
  },

  addCommands() {
    return {
      toggleHighlight:
        (attributes?: { color?: string }) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      setHighlight:
        (attributes?: { color?: string }) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
