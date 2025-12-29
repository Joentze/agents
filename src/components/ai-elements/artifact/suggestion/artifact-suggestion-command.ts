import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { Editor } from "@tiptap/core";
import { suggestionMenu } from "./artifact-suggestion-menu";

export default Extension.create({
  name: "commands",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: any;
          props: any;
        }) => {
          props.command({ editor, range });
        },
        ...suggestionMenu,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
