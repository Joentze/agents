"use client";

import { computePosition, flip, shift } from "@floating-ui/dom";
import { Editor, posToDOMRect } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import { CommandsList, CommandsListRef } from "./commands-list";
import {
  Bold,
  Code,
  File,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  List,
  ListCheck,
  ListOrdered,
  Map,
  PenBox,
  Quote,
  SeparatorHorizontal,
  Sparkle,
  SwatchBook,
  Table,
} from "lucide-react";
import { SiYoutube } from "@icons-pack/react-simple-icons";

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () =>
      posToDOMRect(
        editor.view,
        editor.state.selection.from,
        editor.state.selection.to
      ),
  };

  computePosition(virtualElement, element, {
    placement: "bottom-start",
    strategy: "absolute",
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = "max-content";
    element.style.position = strategy;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
};

export const suggestionMenu = {
  items: ({ query }: { query: string }) => {
    return [
      {
        group: "AI",
        icon: <Sparkle className="text-indigo-500" />,
        title: "Generate Content",
        command: () => {},
      },
      {
        group: "AI",
        icon: <SwatchBook className="text-orange-500" />,
        title: "Generate Flash Cards",
        command: () => {},
      },
      {
        group: "AI",
        icon: <ListCheck className="text-green-500" />,
        title: "Generate MCQs",
        command: () => {},
      },
      {
        group: "AI",
        icon: <PenBox className="text-yellow-500" />,
        title: "Generate Open-Ended",
        command: () => {},
      },
      {
        group: "Media",
        icon: <Image />,
        title: "Image",
        command: () => {},
      },
      {
        group: "Media",
        icon: <Map />,
        title: "Map",
        command: () => {},
      },
      {
        group: "Media",
        icon: <File />,
        title: "PDF File",
        command: () => {},
      },
      {
        group: "Media",
        icon: <SiYoutube className="text-red-500" />,
        title: "YouTube Video",
        command: () => {},
      },

      {
        group: "Styles",
        icon: <Heading1 />,
        title: "Heading 1",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 1 })
            .run();
        },
      },
      {
        group: "Styles",
        icon: <Heading2 />,
        title: "Heading 2",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 2 })
            .run();
        },
      },
      {
        group: "Styles",
        icon: <Heading3 />,
        title: "Heading 3",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 3 })
            .run();
        },
      },
      {
        group: "Styles",
        icon: <Bold />,
        title: "Bold",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor.chain().focus().deleteRange(range).setMark("bold").run();
        },
      },
      {
        group: "Styles",
        icon: <Italic />,
        title: "Italic",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor.chain().focus().deleteRange(range).setMark("italic").run();
        },
      },
      {
        group: "Styles",
        icon: <List />,
        title: "Bullet List",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        group: "Styles",
        icon: <ListOrdered />,
        title: "Numbered List",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        group: "Styles",
        icon: <Code />,
        title: "Code Block",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
      },
      {
        group: "Styles",
        icon: <Quote />,
        title: "Quote",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
      {
        group: "Insert",
        icon: <SeparatorHorizontal />,
        title: "Line Separator",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor.chain().focus().deleteRange(range).insertContent("<hr>").run();
        },
      },
      {
        group: "Insert",
        icon: <Table />,
        title: "Table",
        command: ({ editor, range }: { editor: Editor; range: any }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertTable({ rows: 2, cols: 3, withHeaderRow: true })
            .run();
        },
      },
    ].filter((item) =>
      item.title.toLowerCase().startsWith(query.toLowerCase())
    );
  },

  render: () => {
    let component: ReactRenderer<CommandsListRef>;
    let popup: HTMLElement;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(CommandsList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = component.element;
        popup.style.position = "absolute";
        popup.style.zIndex = "50";

        document.body.appendChild(popup);

        updatePosition(props.editor, popup);
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        updatePosition(props.editor, popup);
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (props.event.key === "Escape") {
          popup.remove();
          component.destroy();

          return true;
        }

        return component.ref?.onKeyDown(props) ?? false;
      },

      onExit() {
        popup.remove();
        component.destroy();
      },
    };
  },
};
